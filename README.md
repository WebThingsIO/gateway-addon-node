# gateway-addon

Node bindings for developing Node add-ons for WebThings Gateway.

**NOTE:** This should _NEVER_ be included as an add-on dependency, as that will cause breakages across gateway versions. The gateway will provide this dependency for every add-on. This package only exists to facilitate building the gateway itself.

For a tutorial on building an add-on, see [this page](https://hacks.mozilla.org/2018/02/creating-an-add-on-for-the-project-things-gateway/).
