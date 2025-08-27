import { User } from 'common';
import React, { createContext, useContext, useState } from 'react';

type UserContextType = {
    user: User | undefined;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<any> = ({ children }) => {
    const [user, setUser] = useState<User | undefined>(undefined);

    // Add functions for handling the user's data. Keep this to be only
    // the most essential topics, since bloating a context is an easy way to seriously bog down an app

    return (
        <UserContext.Provider
            value={{
                user,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export { UserProvider, useUser };
