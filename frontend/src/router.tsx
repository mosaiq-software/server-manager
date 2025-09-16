import Layout from '@/pages/Layout';
import DashboardPage from '@/pages/DashboardPage';
import ProjectPage from '@/pages/ProjectPage';
import ProjectDeployPage from '@/pages/ProjectDeployPage';
import ProjectConfigPage from '@/pages/ProjectConfigPage';
import ProjectLogsPage from '@/pages/ProjectLogsPage';
import WorkersPage from '@/pages/WorkersPage';
import ControlPlaneStatusPage from '@/pages/ControlPlaneStatusPage';
import LandingPage from '@/pages/LandingPage';
import AllowedEntitiesPage from '@/pages/AllowedEntitiesPage';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { useUser } from './contexts/user-context';

const Router = () => {
    const userCtx = useUser();
    if (!userCtx.user) {
        return (
            <Routes>
                <Route
                    path="/"
                    element={<LandingPage />}
                />
                <Route
                    path="/*"
                    element={<p>404</p>}
                />
            </Routes>
        );
    }

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
                    path="/control-plane"
                    element={<ControlPlaneStatusPage />}
                />
                <Route
                    path="/allowed-entities"
                    element={<AllowedEntitiesPage />}
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
