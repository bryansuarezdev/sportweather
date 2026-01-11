import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserProfile } from '../types';

interface ProtectedRouteProps {
    user: UserProfile | null;
    children: React.ReactNode;
}

/**
 * Componente que protege rutas que requieren autenticación
 * Si no hay usuario, redirige a la página de login
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
    if (!user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
