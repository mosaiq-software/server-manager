import { apiGet, apiPost } from '@/utils/api';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { Project } from '@mosaiq/nsm-common/types';
import React, { createContext, useContext, useEffect, useState } from 'react';

type ProjectContextType = {
    projects: Project[];
    create: (newProject: Project) => Promise<void>;
    update: (id: string, updatedProject: Partial<Project>, clientOnly?: boolean) => Promise<void>;
    updateSecret: (projectId: string, secretName: string, newValue: string) => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const ProjectProvider: React.FC<any> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await apiGet(API_ROUTES.GET_PROJECTS, {}, 'AUTH TOKEN...');
                if (!response) {
                    return;
                }
                setProjects(response);
            } catch (error) {
                notifications.show({
                    title: 'Error',
                    message: 'Failed to fetch projects',
                    color: 'red',
                });
            }
        };
        fetchProjects();
    }, []);

    const handleCreateProject = async (newProject: Project) => {
        try {
            await apiPost(API_ROUTES.POST_CREATE_PROJECT, {}, newProject, 'AUTH TOKEN...');
            setProjects((prev) => [...prev, newProject]);
            notifications.show({
                title: 'Success',
                message: 'Project created successfully',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to create project',
                color: 'red',
            });
        }
    };

    const handleUpdateProject = async (id: string, updatedProject: Partial<Project>, clientOnly?: boolean) => {
        try {
            if (!clientOnly) {
                await apiPost(API_ROUTES.POST_UPDATE_PROJECT, { projectId: id }, updatedProject, 'AUTH TOKEN...');
            }
            setProjects((prev) => prev.map((proj) => (proj.id === id ? { ...proj, dirtyConfig: true, ...updatedProject } : proj)));
            notifications.show({
                title: 'Success',
                message: 'Project updated successfully',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to update project',
                color: 'red',
            });
        }
    };

    const updateSecret = async (projectId: string, secretName: string, newValue: string) => {
        try {
            await apiPost(API_ROUTES.POST_UPDATE_ENV_VAR, { projectId }, { value: newValue, varName: secretName }, 'AUTH TOKEN...');
            setProjects((prev) =>
                prev.map((proj) =>
                    proj.id === projectId
                        ? {
                              ...proj,
                              dirtyConfig: true,
                              secrets: proj.secrets?.map((secret) => (secret.secretName === secretName ? { ...secret, secretValue: newValue } : secret)),
                          }
                        : proj
                )
            );
            notifications.show({
                title: 'Success',
                message: 'Secret updated successfully',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to update secret',
                color: 'red',
            });
        }
    };

    return (
        <ProjectContext.Provider
            value={{
                projects,
                create: handleCreateProject,
                update: handleUpdateProject,
                updateSecret,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

const useProjects = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
};

export { ProjectProvider, useProjects };
