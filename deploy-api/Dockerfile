# Use official Node.js image as the base image
FROM node:16-slim

# Set working directory in docker
WORKDIR /app

# Copy the dependencies file to the working directory
COPY package*.json ./

# Install dependencies including devDependencies for the build step
RUN npm install

# Copy the local source files to the working directory
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose the required port
EXPOSE 8080

# Specify the command to run on container start
CMD [ "npm", "start" ]