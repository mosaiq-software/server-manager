import React, { createContext, useContext, useState } from 'react';

type UserContextType = {};

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<any> = ({ children }) => {
    return <UserContext.Provider value={{}}>{children}</UserContext.Provider>;
};

const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export { UserProvider, useUser };
