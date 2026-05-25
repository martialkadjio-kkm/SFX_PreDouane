export function GetSqlDateString(date: Date): string {
     const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}${m}${d}`;
}

export function GetSqlDateTimeString(date: Date): string{
    const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        const h = String(date.getHours()).padStart(2, "0");
        const mn = String(date.getMinutes).padStart(2, "0");
        const s = String(date.getSeconds).padStart(2, "0");
        return `${y}${m}${d} ${h}${mn}${s}`;
}