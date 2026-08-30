export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  return !!getUser();
};

export const logout = () => {
  removeUser();
  window.location.href = '/login';
};

export const hasPermission = (user, appName, permission = 'priv_access') => {
  if (!user || !user.groups) return false;
  
  return user.groups.some(group => 
    group.apps && group.apps.some(app => 
      app.app_name === appName && app.pivot[permission] === 'Y'
    )
  );
};

export const isAdmin = (user) => {
  return user && user.is_admin;
};