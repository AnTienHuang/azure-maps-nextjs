FROM node:18

# Set working directory to /app folder
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install deps
RUN npm install

# # Check installed packages
# RUN npm list

# Copy the rest of app's source code
COPY . .

# Run container on port 3000
EXPOSE 3000
