# select your base image to start with
FROM node:14-alpine3.12

# Create app directory
#RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app


# Install dependencies
COPY package.json .
RUN npm install

COPY . .

# Make this port accessible from outside the container
# Necessary for your browser to send HTTP requests to your Node app
EXPOSE 3001

# Command to run when the container is ready
# Separate arguments as separate values in the array
CMD [ "npm", "run", "dev"]