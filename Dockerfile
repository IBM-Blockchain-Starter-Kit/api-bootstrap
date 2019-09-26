FROM node:8-stretch

# Change working directory
WORKDIR /app

# Update packages and install dependency packages for services
RUN apt-get update \
 && apt-get dist-upgrade -y \
 && apt-get clean \
 && echo 'Finished installing dependencies'

# Install npm production packages
COPY package.json /app/
RUN cd /app; npm install --production

COPY . /app

ENV NODE_ENV production
ENV PORT 3000

EXPOSE 3000

# Build the /dist foler to run
RUN cd /app; npm run build

# Vulnerability Fix: https://cloud.ibm.com/docs/tutorials?topic=solution-tutorials-continuous-deployment-to-kubernetes#cloneandbuildapp
RUN apt-get remove -y mysql-common \
  && rm -rf /etc/mysql

CMD ["npm", "start"]

USER node
#EOF