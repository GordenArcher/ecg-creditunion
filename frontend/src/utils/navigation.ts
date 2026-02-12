let navigate: ((path: string) => void) | null = null;

export const setNavigator = (nav: (path: string) => void) => {
  navigate = nav;
};

export const navigateTo = (path: string) => {
  if (navigate) navigate(path);
};
