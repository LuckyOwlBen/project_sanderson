export abstract class AbstractDerivedAttributes {
    protected getTableIndex(attributeValue: number): number {
        return Math.floor(attributeValue / 2);
    }

    protected getValueFromTable<T>(table: T[], attributeValue: number): T {
        const index = this.getTableIndex(attributeValue);
        return table[Math.min(index, table.length - 1)];
    }
}