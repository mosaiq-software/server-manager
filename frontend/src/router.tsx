import LandingPage from '@/pages/LandingPage';
import ProfilePage from '@/pages/ProfilePage';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

const Router = () => {
    return (
        <Routes>
            <Route
                path="/"
                element={<LandingPage />}
            />
            <Route
                path="/u/:userId"
                element={<ProfilePage />}
            />
            <Route
                path="/*"
                element={<p>404</p>}
            />
        </Routes>
    );
};

export default Router;
