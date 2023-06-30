# Sidekick

 Sidekick is a tool written in Node.js for processing `.side` files. It is designed to work with Selenium IDE projects, allowing you to filter and export your test suites into New Relic Scripted Browser compatible files.

 ## Installation

 You can install Sidekick globally using npm:

 ```bash
 npm install -g sidekick
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

 ## Contributing

 Contributions to Sidekick are welcome. Please submit a pull request or open an issue on the project's GitHub page.

 ## License

 Sidekick is licensed under the MIT License.
