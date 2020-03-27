import express, { Application } from "express";
import http from "http";
import https from "https";
import { Server } from "net";
import expressWs from "express-ws";

import defaultConfig, { IConfig } from "./config";
import { createInstance } from "./instance";

type Optional<T> = {
  [P in keyof T]?: (T[P] | undefined);
};

function ExpressPeerServer(app: Application, options?: IConfig) {
  const newOptions: IConfig = {
    ...defaultConfig,
    ...options
  };

  if (newOptions.proxied) {
    app.set("trust proxy", newOptions.proxied === "false" ? false : !!newOptions.proxied);
  }

  if (!(app as any).ws) {
    expressWs(app);
  }

  createInstance({ app, options: newOptions });

  return app;
}

function PeerServer(options: Optional<IConfig> = {}, callback?: (server: Server) => void) {
  const app = express();
  expressWs(app);

  const newOptions: IConfig = {
    ...defaultConfig,
    ...options
  };

  const port = newOptions.port;

  let server: Server;

  if (newOptions.ssl && newOptions.ssl.key && newOptions.ssl.cert) {
    server = https.createServer(options.ssl!, app);
    // @ts-ignore
    delete newOptions.ssl;
  } else {
    server = http.createServer(app);
  }

  const peerjs = ExpressPeerServer(app, newOptions);
  app.use(peerjs);

  server.listen(port, () => callback?.(server));

  return peerjs;
}

export {
  ExpressPeerServer,
  PeerServer
};
