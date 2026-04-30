(() => {
  const AUTH_KEY = 'som_auth_role_v1';

  function getRole() {
    return sessionStorage.getItem(AUTH_KEY) || '';
  }

  function setRole(role) {
    sessionStorage.setItem(AUTH_KEY, role);
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
  }

  function requireRole(expectedRole, loginPath = 'login.html') {
    if (getRole() !== expectedRole) {
      window.location.replace(loginPath + '?next=' + encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html'));
      return false;
    }
    return true;
  }

  window.SOM_AUTH = { getRole, setRole, logout, requireRole };
})();
