export const openModalById = (id: string) => {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLDialogElement)) {
    console.warn(`Modal dialog not found: ${id}`);
    return;
  }
  if (!element.open) {
    element.showModal();
  }
};

export const closeModalById = (id: string) => {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLDialogElement)) {
    console.warn(`Modal dialog not found: ${id}`);
    return;
  }
  if (element.open) {
    element.close();
  }
};
