class InventoryStacking {
    constructor() {
        this.maxStackSize = 99;
        this.stackableTypes = ['seeds', 'food', 'water', 'wood', 'stone', 'grass', 'medicine', 'materials'];
    }

    isStackable(itemType) {
        return this.stackableTypes.includes(itemType);
    }

    getMaxStackSize(itemType) {
        if (!this.isStackable(itemType)) {
            return 1;
        }
        return this.maxStackSize;
    }

    stackItems(inventory) {
        const stackedItems = [];
        
        for (const [itemType, count] of Object.entries(inventory)) {
            if (count <= 0) continue;
            
            if (this.isStackable(itemType)) {
                const maxStack = this.maxStackSize;
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
                slots += Math.ceil(count / this.maxStackSize);
            } else {
                slots += count;
            }
        }
        
        return slots;
    }

    canAddItem(inventory, itemType, count, maxSlots = 40) {
        const currentSlots = this.getSlotsNeeded(inventory);
        const newSlots = this.getSlotsNeeded({ ...inventory, [itemType]: (inventory[itemType] || 0) + count });
        
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
        
        let remainingCount = newCount;
        
        for (const stack of result) {
            if (stack.type === newItemType && !stack.isFullStack && remainingCount > 0) {
                const space = this.maxStackSize - stack.count;
                const addAmount = Math.min(space, remainingCount);
                
                stack.count += addAmount;
                remainingCount -= addAmount;
                
                if (stack.count >= this.maxStackSize) {
                    stack.isFullStack = true;
                }
            }
        }
        
        while (remainingCount > 0) {
            const stackSize = Math.min(remainingCount, this.maxStackSize);
            result.push({
                type: newItemType,
                count: stackSize,
                isFullStack: stackSize >= this.maxStackSize
            });
            remainingCount -= stackSize;
        }
        
        return result;
    }

    splitStack(stack, splitCount) {
        if (splitCount <= 0 || splitCount >= stack.count) {
            return [stack];
        }
        
        return [
            {
                type: stack.type,
                count: splitCount,
                isFullStack: splitCount >= this.maxStackSize
            },
            {
                type: stack.type,
                count: stack.count - splitCount,
                isFullStack: (stack.count - splitCount) >= this.maxStackSize
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
        
        const totalCount = stack1.count + stack2.count;
        
        if (totalCount <= this.maxStackSize) {
            return [{
                type: stack1.type,
                count: totalCount,
                isFullStack: totalCount >= this.maxStackSize
            }];
        }
        
        return [
            {
                type: stack1.type,
                count: this.maxStackSize,
                isFullStack: true
            },
            {
                type: stack1.type,
                count: totalCount - this.maxStackSize,
                isFullStack: false
            }
        ];
    }
}

export { InventoryStacking };