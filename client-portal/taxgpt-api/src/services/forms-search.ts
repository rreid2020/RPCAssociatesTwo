export type FormListRow = {
  id: string;
  formCode: string;
};

export function mergeFormResults<T extends FormListRow>(primary: T[], aliases: T[]): T[] {
  const map = new Map<string, T>();
  primary.forEach((form) => map.set(form.id, form));
  aliases.forEach((form) => {
    if (!map.has(form.id)) {
      map.set(form.id, form);
    }
  });
  return Array.from(map.values()).sort((a, b) => a.formCode.localeCompare(b.formCode));
}
