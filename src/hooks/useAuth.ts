export const useAuth = () => {
  const isAuthenticated = () => !!localStorage.getItem('token');
  const saveToken = (token: string) => localStorage.setItem('token', token);
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  return { isAuthenticated, saveToken, logout };
};
