# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the application (if required, e.g., for NestJS apps)
RUN yarn run build

# Set environment variables (Optional: Use a .env file if needed)
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Command to start the application
CMD ["yarn", "run", "start:prod"]
