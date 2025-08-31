import Layout from '@/pages/Layout';
import DashboardPage from '@/pages/DashboardPage';
import ProjectPage from '@/pages/ProjectPage';
import ProjectDeployPage from '@/pages/ProjectDeployPage';
import ProjectConfigPage from '@/pages/ProjectConfigPage';
import ProjectLogsPage from '@/pages/ProjectLogsPage';
import WorkersPage from '@/pages/WorkersPage';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

const Router = () => {
    return (
        <Layout>
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
                    path="/p/:projectId/deploy"
                    element={<ProjectDeployPage />}
                />
                <Route
                    path="/p/:projectId/config"
                    element={<ProjectConfigPage />}
                />
                <Route
                    path="/p/:projectId/logs"
                    element={<ProjectLogsPage />}
                />
                <Route
                    path="/workers"
                    element={<WorkersPage />}
                />
                <Route
                    path="/*"
                    element={<p>404</p>}
                />
            </Routes>
        </Layout>
    );
};

export default Router;
