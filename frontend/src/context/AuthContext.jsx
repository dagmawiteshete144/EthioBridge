import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ethiobridge_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('ethiobridge_token') || null;
  });

  const [loading, setLoading] = useState(true);

  const justLoggedIn = useRef(false);


  // Logout
  const logout = useCallback(() => {
    console.log('[AUTH] logout called');

    setToken(null);
    setUser(null);

    localStorage.removeItem('ethiobridge_token');
    localStorage.removeItem('ethiobridge_user');
  }, []);



  // Verify token when app starts
  useEffect(() => {
    let cancelled = false;

    const verify = async () => {

      if (!token) {
        console.log('[AUTH] No token found');

        justLoggedIn.current = false;
        setLoading(false);
        return;
      }


      if (justLoggedIn.current) {
        console.log('[AUTH] Token created by login, skip blocking UI');
        setLoading(false);
      }


      try {

        console.log('[AUTH] Verifying token...');


        const res = await authAPI.getMe({
          headers: {
            'X-Skip-Auth-Redirect': 'true'
          }
        });


        if (cancelled) return;


        console.log(
          '[AUTH] Token valid:',
          res.data.user?.email,
          res.data.user?.role
        );


        setUser(res.data.user);


        localStorage.setItem(
          'ethiobridge_user',
          JSON.stringify(res.data.user)
        );


      } catch(error) {


        if (cancelled) return;


        if (justLoggedIn.current) {


          console.warn(
            '[AUTH] getMe failed after login:',
            error.response?.data || error.message
          );


        } else {


          console.error(
            '[AUTH] Token invalid:',
            error.response?.data || error.message
          );


          logout();

        }


      } finally {


        if (!cancelled) {

          justLoggedIn.current = false;
          setLoading(false);

        }

      }

    };


    verify();


    return () => {
      cancelled = true;
    };


  }, [token, logout]);




  // LOGIN FUNCTION
  const login = useCallback(async (email, password) => {


    console.log('[AUTH] login() called');
    console.log('[AUTH] Email:', email);



    try {


      console.log('[AUTH] Sending login request...');


      const res = await authAPI.login({
        email,
        password
      });



      console.log('[AUTH] Login response received');
      console.log('[AUTH] Response data:', res.data);



      const { token: t, user: u } = res.data;



      if (!t || !u) {

        console.error('[AUTH] Missing token or user');

        throw new Error('Invalid login response');

      }



      console.log(
        '[AUTH] User role:',
        u.role
      );



      justLoggedIn.current = true;



      setToken(t);

      setUser(u);



      localStorage.setItem(
        'ethiobridge_token',
        t
      );


      localStorage.setItem(
        'ethiobridge_user',
        JSON.stringify(u)
      );



      console.log('[AUTH] Login completed successfully');



      return u;



    } catch(error) {


      console.error('[AUTH] Login failed');


      if(error.response){

        console.error(
          '[AUTH] Server error:',
          error.response.data
        );

      }else{

        console.error(
          '[AUTH] Error:',
          error.message
        );

      }



      throw error;


    }


  }, []);






  // Register
  const register = useCallback(async (formData) => {

    const res = await authAPI.register(formData);

    const { token: t, user: u } = res.data;

    if (t && u) {
      justLoggedIn.current = true;
      setToken(t);
      setUser(u);
      localStorage.setItem('ethiobridge_token', t);
      localStorage.setItem('ethiobridge_user', JSON.stringify(u));
      console.log('[AUTH] Registration successful, auto-logged in');
      return u;
    }

    return res.data;

  }, []);






  // Update user
  const updateUser = useCallback((updatedUser) => {


    setUser(updatedUser);


    localStorage.setItem(
      'ethiobridge_user',
      JSON.stringify(updatedUser)
    );


  }, []);






  const isRole = (...roles) => {

    return roles.includes(user?.role);

  };






  return (

    <AuthContext.Provider

      value={{

        user,

        token,

        loading,

        login,

        register,

        logout,

        updateUser,

        isRole,

        isAuthenticated: !!user

      }}

    >

      {children}

    </AuthContext.Provider>

  );


};





export const useAuth = () => {


  const ctx = useContext(AuthContext);


  if (!ctx) {


    throw new Error(
      'useAuth must be used inside AuthProvider'
    );


  }


  return ctx;


};