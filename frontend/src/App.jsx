import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import Login from './pages/auth/Login';
function Guard({children}){const {isAuthenticated,user,loading}=useAuth();if(loading)return <div style={{padding:40}}>Loading...</div>;if(!isAuthenticated)return <Navigate to="/login" replace/>;if(user?.role!=='admin')return <Navigate to="/login" replace/>;return children;}
export default function App(){return <ThemeProvider><AuthProvider><SocketProvider><Routes><Route path="/login" element={<Login/>}/><Route path="/dashboard/admin/*" element={<Guard><AdminDashboard/></Guard>}/><Route path="/" element={<Navigate to="/dashboard/admin" replace/>}/><Route path="*" element={<Navigate to="/dashboard/admin" replace/>}/></Routes></SocketProvider></AuthProvider></ThemeProvider>}
