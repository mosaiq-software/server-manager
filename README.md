# Node Server Manager

## Overview

The Node Server Manager (NSM) is a simple manager system built on top of Git and Docker to streamline the deployment and management of applications. While it has no configuration files, it requires a specific directory structure to function correctly.

## Structure of Projects

NSM deploys "projects", each one of which has a single Git repository hosted on Github. Each project must contain a **Docker Compose** file at its root. This file is used to deploy the application using Docker.

A project can have multiple services, each defined in the Docker Compose file. All services will share the same environment variables, which are defined in a `.env*` (any file starting with `.env`) file located in the root of the project. This allows for easy coordination between services without needing to duplicate environment variable definitions.

## Configuration of Projects

Each project has a set of configs available to it on the NSM website. These configs are:

### General

General configurations that apply to the project as a whole.

- **Repository (Owner | Name | Branch)**: The GitHub repository details where the project's code is hosted. This must be accessible by Tilebot (user-specific support planned for later).
- **Worker Node**: The specific worker node where the project will be deployed. This allows for load balancing and resource management across multiple physical or virtual machines.
- **Deployment Timeout**: The maximum time allowed for a deployment to complete. If the deployment exceeds this time, it will be aborted to prevent hanging processes.
- **Allow CI/CD**: A toggle to enable or disable Continuous Integration/Continuous Deployment for the project. When enabled, the project will be able to be automatically deployed upon the calling of a webhook.

### Domain Configuration

Configurations related to the "external access" of the project. This is handled under the hood by Nginx.
A project can have multiple domain configurations, each one defining a unique domain/url that points to the project (e.g., `example.com`, `app.example.com`, etc.).
Each domain can have multiple resources. Each resource is defined by a unique path (e.g., `/`, `/api`, `/dashboard`, etc.) and has a type. The type defines how the resource is handled by Nginx. The available types are:

- **Static Page**: Points the path to a static file directory, such as the build output of a frontend application. This is handled by a `root` directive (and `try_files` if needed SPA mode is enabled) in Nginx.
- **API Service**: Points the path to a server running on a single port. This is handled by a `proxy_pass` directive in Nginx.
- **Redirect Link**: Redirects the path to another URL. This is handled by a 302 redirect in Nginx as to not make the redirect permanent in case it needs to be changed later.
- **Custom**: Allows for a custom location block to be defined. This is useful for more advanced use cases that are not covered by the other types.
  Each domain will have its own SSL certificate generated and renewed automatically.

### System Configuration

#### Environment Variables

Each project will have a `.env` file generated at its root upon deployment. This file will contain all the environment variables defined in NSM for the project. These environment variables will be available to all services defined in the Docker Compose file.
Environment variables can be defined in two ways:

- **Normal**: The value is stored as-is and will be injected into the `.env` file as-is.
- **Variable**: The value is stored as a reference to another config or an automated value. The available variable types are:

##### Variable Types

- **WorkerNodeId**: The ID of the worker node where the project is deployed.
- **Volume**: The path to a single persistent volume associated with the project. This is useful for services that require persistent storage, such as databases.
- **Domain**: The domain name of a specific domain configuration associated with the project. No protocol or path is included, just the domain name (e.g., `example.com`).
- **URL**: The full URL of a specific resource in a domain configuration associated with the project. This includes the protocol, domain name, and path (e.g., `https://example.com/api`).
- **Path**: The path of a specific resource in a domain configuration associated with the project. This includes just the path (e.g., `/api`).
- **Directory**: The path to a single **non-persistent** directory for a Static Page resource. This will be deleted and recreated upon each deployment. This is useful for storing build outputs of frontend applications. Do not use this for persistent storage, as the data will be lost upon redeployment.
- **Port**: A random available port on the worker node. This is useful for services that require a unique port, such as web servers. Ports should never be hardcoded, as they may change across deployments.
- **Target**: The target of a Redirect Link resource. This is useful for services that need to know where they are redirecting to.

#### Docker Compose Services

A list of each service found under the `services` key in the Docker Compose file. Each service has the option to have container logs collected and stored for it. This is useful for debugging and monitoring purposes, but can take up a lot of disk space if enabled for too many services or if the logs are too verbose.
Each services has an expected state. This is what state the service should be in "after some time" post deployment once the dust has settled. The available states are:

- **Unknown**: The service state is unknown. This is the initial state before any checks have been made.
- **Running**: The service should be running and healthy.
- **Exited**: The service should be exited. This is useful for one-off tasks that should run to completion and then stop, such as build jobs.
- **Created**: The service should be created but not started. This is useful for services that will be started manually later.
- **Paused**: The service should be paused.
- **Restarting**: The service should be in the process of restarting. Containers in this state likely have an issue that needs to be resolved.
- **Removing**: The service should be in the process of being removed by Docker.
- **Dead**: The service should be in a "defunct" state. This is likely due to an issue that needs to be resolved.

## Deployment Process

A project can be deployed in two ways: the deploy menu on the NSM website, or via a webhook. The webhook can be called by a CI/CD system such as GitHub Actions. Webhooks will return an error if CI/CD is not enabled for the project.

When a deployment is initiated, the following steps occur:

1. **Tear Down Existing Deployment**: If the project is already deployed, the existing deployment is torn down. This involves stopping and removing all Docker containers, networks, and volumes associated with the project. Old images will be pruned to free up space.
2. **Update Repository**: The specified GitHub repository is re-cloned to the latest commit on the specified branch. If major changes in the way a project has been configured have occurred, the deployment will fail and require manual intervention to ensure everything is set up correctly.
3. **Generate Config Files**: The `.env`, `docker-compose.yml`, and `project_name.conf` (Nginx config) files are generated based on the project's configurations.
4. **Send to Worker Node**: The generated files and project's data are sent to the specified worker node.
5. **Clone Project To Worker Node**: The worker node clones the project's repository to a specific directory.
6. **Ensure Volumes & Directories**: The worker node ensures that all persistent volumes and non-persistent directories defined in the project's configurations exist. If they do not exist, they are created.
7. **Deploy with Docker Compose**: The worker node uses Docker Compose to deploy the project. This involves creating and starting all Docker containers, networks, and volumes defined in the `docker-compose.yml` file.
8. **Set Up Nginx and SSL**: The Control Plane's dedicated worker node injects the projects Nginx configuration into the main Nginx instance and ensures that SSL certificates are generated and renewed automatically using Let's Encrypt's Certbot.
