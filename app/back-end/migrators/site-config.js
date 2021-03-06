const fs = require('fs');
const path = require('path');
const slug = require('./../helpers/slug');
const sql = require('./../vendor/sql.js');

class SiteConfigMigrator {
    static moveOldAuthorData(appInstance, siteConfig) {
        // Check if old author data exists
        if(!siteConfig.author && siteConfig.author !== null) {
            // Return unmodified site config
            return siteConfig;
        }

        console.log('MIRATION IN: ' + siteConfig.name);

        // If yes - save them in database as author with ID = 1
        let siteDir = path.join(appInstance.sitesDir, siteConfig.name);
        let dbPath = path.join(siteDir, 'input', 'db.sqlite');
        let input = fs.readFileSync(dbPath);
        let db = new sql.Database(input);
        let newAuthorName = siteConfig.author.name;
        let newAuthorUsername = slug(newAuthorName);
        let newAuthorConfig = {
            avatar: siteConfig.author.avatar,
            email: siteConfig.author.email,
            description: siteConfig.author.description,
            useGravatar: siteConfig.author.useGravatar
        };
            newAuthorConfig = JSON.stringify(newAuthorConfig);
        let configFilePath = path.join(siteDir, 'input', 'config', 'site.config.json');
        let sqlQuery = db.prepare(`
            UPDATE 
                authors 
            SET 
                name = ?, 
                username = ?, 
                config = ? 
            WHERE 
                id = 1;
        `);

        sqlQuery.run([
            newAuthorName,
            newAuthorUsername,
            newAuthorConfig
        ]);

        sqlQuery.free();

        // Store data in DB file
        let data = db.export();
        let buffer = new Buffer(data);
        fs.writeFileSync(path.join(siteDir, 'input', 'db.sqlite'), buffer);

        // Remove from the config author data
        delete siteConfig.author;
        fs.writeFileSync(configFilePath, JSON.stringify(siteConfig), {'flags': 'w'});

        // Return modified (or not) site config
        return siteConfig;
    }
}

module.exports = SiteConfigMigrator;
