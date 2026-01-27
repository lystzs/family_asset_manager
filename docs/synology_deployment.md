# Synology NAS Deployment Guide

This guide explains how to deploy the Family Asset Manager (FAM) to your Synology NAS using Docker.

## Prerequisites

1.  **Synology NAS** with DSM installed.
2.  **Container Manager** (formerly Docker) package installed from the Package Center.
3.  **SSH Access** enabled (optional but recommended for setup) or ability to upload files via File Station.

## Deployment Steps

### 1. Prepare the Project Files

You need to transfer the following files/folders to your NAS (e.g., to `/volume1/docker/fam`):

- `backend/` (folder)
- `frontend/` (folder)
- `docker-compose.yml` (file)
- `data/` (folder - create if empty, used for database)

**Important**: 
- Ensure `backend/requirements.txt` is present.
- Ensure `frontend/package.json`, `package-lock.json` are present.
- Ensure `frontend/next.config.ts` has `output: "standalone"`.

### 2. Configure Environment

Open `docker-compose.yml` and check the environment variables.
- `NEXT_PUBLIC_API_URL`: By default, this is set to `http://localhost:8000`. **You MUST change this** to your NAS IP address if you want to access it from other devices on your network.
  Example: `NEXT_PUBLIC_API_URL=http://192.168.68.51:8000`

### 3. Deploy using Container Manager

1.  Open **Container Manager** on your Synology NAS.
2.  Go to **Project** tab.
3.  Click **Create**.
4.  **Project Name**: `fam-app` (or your choice).
5.  **Path**: Browse to the folder where you uploaded the files (e.g., `/docker/fam`).
6.  **Source**: Select "Use existing docker-compose.yml".
7.  Click **Next**, then **Done**.
8.  The system will build the images and start the containers. This may take a few minutes.

### 4. Verify Deployment

- **Backend**: Access `http://<NAS_IP>:8000/docs` to see the API documentation.
- **Frontend**: Access `http://<NAS_IP>:3000` to use the application.

## Troubleshooting

- **Build Failures**: Check the logs in Container Manager. If `frontend` fails to build, standard NAS with limited RAM (e.g., < 2GB) might struggle with `npm run build`. You might need to build the image locally on your PC and push it to the NAS or a registry.
- **Connection Refused**: Ensure the ports `3000` and `8000` are allowed in the Synology Firewall if enabled.
