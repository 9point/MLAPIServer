const Handlebars = require('handlebars');

const fs = require('fs');
const path = require('path');

const _COMPILED_TEMPLATES = {};

function config() {
  configImpl()
    .then(() => {
      console.log('Cluster manager templates configured');
    })
    .catch((error) => {
      console.error('Failed to configure cluster manager templates');
    });
}

async function configImpl() {
  const jobBuffer = await genRead(path.join(__dirname, 'job.yml.handlebars'));
  const jobTemplate = Handlebars.compile(jobBuffer);
  _COMPILED_TEMPLATES['job'] = jobTemplate;
}

async function genJob(config) {
  const filename = `job-${config.id}.yml`;
  const filepath = path.join(process.env.LOCAL_CACHE_DIR, filename);
  const compiled = _COMPILED_TEMPLATES['job'](config);
  await genWrite(filepath, compiled);
  return filepath;
}

function genRead(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (error, buffer) => {
      if (error) {
        reject(error);
      } else {
        resolve(buffer);
      }
    });
  });
}

function genWrite(filename, buffer) {
  return new Promise((resolve, reject) => {
    const dirname = path.dirname(filename);
    fs.exists(dirname, (exists) => {
      if (!exists) {
        fs.mkdirSync(dirname);
      }

      fs.writeFile(filename, buffer, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  });
}

module.exports = {
  config,
  genJob,
};
