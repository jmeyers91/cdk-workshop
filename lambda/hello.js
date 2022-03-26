exports.handler = async (event) => {
  console.log("request", JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Good morning, CDK! You've hit ${event.path}`,
  };
};
