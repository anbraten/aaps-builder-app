# AAPS builder :wrench:

AAPS builder allows you to build [AAPS](https://github.com/nightscout/AndroidAPS) using Github Actions.

## Usage

1. Fork this repository

2. Go to your repository settings and add the following secrets:

  - `GH_TOKEN`: Github token with access to your forked repository
  - `SIGNING_KEY`: Base64 encoded signing key
  - `SIGNING_KEY_PASSWORD`: Password for the signing key
  - `SIGNING_KEY_ALIAS`: Alias for the signing key

3. Run the build workflow

## TODO

- [ ] Simplify secret store setup / upload
- [ ] Enhance way to receive the build artifact without publicly storing it
