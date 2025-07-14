export default (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const entry = {
      ts: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start
    };


    
    process.stdout.write(JSON.stringify(entry) + '\n');
  });

  next();
};
