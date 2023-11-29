<a href="https://opensource.newrelic.com/oss-category/#new-relic-experimental"><picture><source media="(prefers-color-scheme: dark)" srcset="https://github.com/newrelic/opensource-website/raw/main/src/images/categories/dark/Experimental.png"><source media="(prefers-color-scheme: light)" srcset="https://github.com/newrelic/opensource-website/raw/main/src/images/categories/Experimental.png"><img alt="New Relic Open Source experimental project banner." src="https://github.com/newrelic/opensource-website/raw/main/src/images/categories/Experimental.png"></picture></a>

# New Relic Sidekick

 Sidekick is a tool written in Node.js for processing `.side` files. It is designed to work with Selenium IDE projects, allowing you to filter and export your test suites into New Relic Scripted Browser compatible files.

 ## NPM

You can find this package on npm: [newrelic-sidekick](https://www.npmjs.com/package/newrelic-sidekick)


 ## Installation

 You can install Sidekick globally using npm:

 ```bash
 npm install -g newrelic-sidekick
 ```

 ## Usage

 To use Sidekick, you need to provide an input `.side` file and an output directory:

 ```bash
 sidekick <input.side> <output_directory>
 ```

 For example:

 ```bash
 sidekick myProject.side ./output
 ```

 This will process the `myProject.side` file and output the results to the `./output` directory.

## Support

New Relic hosts and moderates an online forum where customers can interact with New Relic employees as well as other customers to get help and share best practices.

## Contributing
We encourage your contributions to improve newrelic-sidekick! Keep in mind when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. You only have to sign the CLA one time per project.
If you have any questions, or to execute our corporate CLA, required if your contribution is on behalf of a company,  please drop us an email at opensource@newrelic.com.

**A note about vulnerabilities**

As noted in our [security policy](https://github.com/newrelic-experimental/newrelic-sidekick/security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [HackerOne](https://hackerone.com/newrelic).

## License
New Relic SideKick is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) License.
