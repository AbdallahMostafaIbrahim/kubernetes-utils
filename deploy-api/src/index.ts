import express from "express";
import k8s = require("@kubernetes/client-node");
import dotenv from "dotenv";
dotenv.config();

const app = express();

const kc = new k8s.KubeConfig();
kc.loadFromCluster();

const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

app.use(express.json());

app.get("/", (req, res) => {
  console.dir(req.headers, { depth: null });
  res.json({
    status: "OK",
  });
});

app.post("/rollout/restart", async (req, res) => {
  try {
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
      patchBody,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        headers: {
          "Content-Type": "application/merge-patch+json",
        },
      }
    );

    res.json(response.body);
  } catch (e) {
    console.log(e as any);
    res.status(500).json({
      error: (e as Error).message,
    });
  }
});

if (!process.env.SECRET) {
  console.error("SECRET is required");
  process.exit(1);
} else if (!process.env.PORT) {
  console.error("PORT is required");
  process.exit(1);
}

app.listen(process.env.PORT, () => {
  console.log("🚀 Server running on port", process.env.PORT + "....");
});
