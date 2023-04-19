export function toReadableDate(at: Date | string = new Date()) {
    return new Date(at).toString().split('GMT')[0].trim();
}
