import DashboardPage from '@/pages/DashboardPage';
import ProjectPage from '@/pages/ProjectPage';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

const Router = () => {
    return (
        <Routes>
            <Route
                path="/"
                element={<DashboardPage />}
            />
            <Route
                path="/p/:projectId"
                element={<ProjectPage />}
            />
            <Route
                path="/*"
                element={<p>404</p>}
            />
        </Routes>
    );
};

export default Router;
