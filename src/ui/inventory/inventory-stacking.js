import { InventoryItems } from './inventory-items.js';

class InventoryStacking {
    constructor() {
        this.defaultMaxStackSize = 99;
    }

    isStackable(itemType) {
        return InventoryItems.isStackable(itemType);
    }

    getMaxStackSize(itemType) {
        return InventoryItems.getMaxStackSize(itemType);
    }

    stackItems(inventory) {
        const stackedItems = [];
        
        for (const [itemType, count] of Object.entries(inventory)) {
            if (count <= 0) continue;
            
            if (this.isStackable(itemType)) {
                const maxStack = this.getMaxStackSize(itemType);
                const fullStacks = Math.floor(count / maxStack);
                const remainder = count % maxStack;
                
                for (let i = 0; i < fullStacks; i++) {
                    stackedItems.push({
                        type: itemType,
                        count: maxStack,
                        isFullStack: true
                    });
                }
                
                if (remainder > 0) {
                    stackedItems.push({
                        type: itemType,
                        count: remainder,
                        isFullStack: false
                    });
                }
            } else {
                for (let i = 0; i < count; i++) {
                    stackedItems.push({
                        type: itemType,
                        count: 1,
                        isFullStack: true
                    });
                }
            }
        }
        
        return stackedItems;
    }

    countTotalItems(inventory) {
        let total = 0;
        for (const count of Object.values(inventory)) {
            total += count;
        }
        return total;
    }

    getSlotsNeeded(inventory) {
        let slots = 0;
        
        for (const [itemType, count] of Object.entries(inventory)) {
            if (count <= 0) continue;
            
            if (this.isStackable(itemType)) {
                slots += Math.ceil(count / this.getMaxStackSize(itemType));
            } else {
                slots += count;
            }
        }
        
        return slots;
    }

    canAddItem(inventory, itemType, count, maxSlots = 40) {
        const currentSlots = this.getSlotsNeeded(inventory);
        const newInventory = { ...inventory };
        newInventory[itemType] = (newInventory[itemType] || 0) + count;
        const newSlots = this.getSlotsNeeded(newInventory);
        
        return newSlots <= maxSlots;
    }

    mergeStacks(existingStacks, newItemType, newCount) {
        const result = [...existingStacks];
        
        if (!this.isStackable(newItemType)) {
            for (let i = 0; i < newCount; i++) {
                result.push({
                    type: newItemType,
                    count: 1,
                    isFullStack: true
                });
            }
            return result;
        }
        
        const maxStack = this.getMaxStackSize(newItemType);
        let remainingCount = newCount;
        
        for (const stack of result) {
            if (stack.type === newItemType && !stack.isFullStack && remainingCount > 0) {
                const space = maxStack - stack.count;
                const addAmount = Math.min(space, remainingCount);
                
                stack.count += addAmount;
                remainingCount -= addAmount;
                
                if (stack.count >= maxStack) {
                    stack.isFullStack = true;
                }
            }
        }
        
        while (remainingCount > 0) {
            const stackSize = Math.min(remainingCount, maxStack);
            result.push({
                type: newItemType,
                count: stackSize,
                isFullStack: stackSize >= maxStack
            });
            remainingCount -= stackSize;
        }
        
        return result;
    }

    splitStack(stack, splitCount) {
        if (splitCount <= 0 || splitCount >= stack.count) {
            return [stack];
        }
        
        const maxStack = this.getMaxStackSize(stack.type);
        
        return [
            {
                type: stack.type,
                count: splitCount,
                isFullStack: splitCount >= maxStack
            },
            {
                type: stack.type,
                count: stack.count - splitCount,
                isFullStack: (stack.count - splitCount) >= maxStack
            }
        ];
    }

    combineStacks(stack1, stack2) {
        if (stack1.type !== stack2.type) {
            return [stack1, stack2];
        }
        
        if (!this.isStackable(stack1.type)) {
            return [stack1, stack2];
        }
        
        const maxStack = this.getMaxStackSize(stack1.type);
        const totalCount = stack1.count + stack2.count;
        
        if (totalCount <= maxStack) {
            return [{
                type: stack1.type,
                count: totalCount,
                isFullStack: totalCount >= maxStack
            }];
        }
        
        return [
            {
                type: stack1.type,
                count: maxStack,
                isFullStack: true
            },
            {
                type: stack1.type,
                count: totalCount - maxStack,
                isFullStack: false
            }
        ];
    }
}

export { InventoryStacking };