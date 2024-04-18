import AWS from "aws-sdk";

import { config } from "./config";

const useAWSS3 = (): AWS.S3 => {
  const { accessKeyID, secretAccessKey } = config.get("s3");
  if (!accessKeyID || !secretAccessKey) {
    throw new Error("AWS S3 credentials are not configured");
  }

  AWS.config.update({
    // @ts-ignore
    accessKeyId: accessKeyID,
    // @ts-ignore
    secretAccessKey,
    region: config.get("s3").bucketRegion,
  });

  return new AWS.S3();
};

const createAWSS3ReadPresignedURL = (path: string): string => {
  const s3 = useAWSS3();

  return s3.getSignedUrl("getObject", {
    Key: path,
    Bucket: config.get("s3").bucketName,
    Expires: 86400 * 30, // 30 days
  });
};

export { useAWSS3, createAWSS3ReadPresignedURL };
