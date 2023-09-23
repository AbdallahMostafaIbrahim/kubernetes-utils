import express from "express";
import k8s = require("@kubernetes/client-node");
import dotenv from "dotenv";
dotenv.config();

const app = express();

const kc = new k8s.KubeConfig();

const base64KubeConfig = process.env.KUBECONFIG as string;
let buff = Buffer.from(base64KubeConfig, "base64");
let kubeConfig = buff.toString("utf-8");

kc.loadFromString(kubeConfig);

const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

app.use(express.json());

app.post("/rollout/restart", async (req, res) => {
  const secret = req.headers.authorization;
  if (secret !== process.env.SECRET) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const deploymentName = req.body.deploymentName;
  const namespace = req.body.namespace;

  if (!deploymentName || !namespace) {
    return res.status(400).json({
      error: "deploymentName and namespace are required",
    });
  }

  const patchBody = {
    spec: {
      template: {
        metadata: {
          annotations: {
            "kubectl.kubernetes.io/restartedAt": new Date().toISOString(),
          },
        },
      },
    },
  };

  const response = await k8sApi.patchNamespacedDeployment(
    deploymentName,
    namespace,
    patchBody
  );

  res.json(response.body);
});

if (!process.env.SECRET) {
  console.error("SECRET is required");
  process.exit(1);
} else if (!process.env.KUBECONFIG) {
  console.error("KUBECONFIG is required");
  process.exit(1);
} else if (!process.env.PORT) {
  console.error("PORT is required");
  process.exit(1);
}

app.listen(process.env.PORT, () => {
  console.log("🚀 Server running on port", process.env.PORT + "....");
});
