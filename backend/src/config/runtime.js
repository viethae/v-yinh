let workerEnvironment = null;

export function setWorkerEnvironment(environment) {
  workerEnvironment = environment;
}

export function getRuntimeVariable(name) {
  return workerEnvironment?.[name] ?? process.env[name];
}

export function getRuntimeBinding(name) {
  return workerEnvironment?.[name] ?? null;
}
