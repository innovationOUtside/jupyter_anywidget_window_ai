# BUILD

Notes on creating and working with this repo.

## Creating initial repo

`npm create anywidget@latest`

Select: `vanilla` then `Javasvript (bundles dependencies with esbuild)`

`npm install`

Edit `package.json` to build more widely (`esbuild js/*.js ... --loader:.html=text`)

## Build

`npm install`

`npm run build`

`hatch build`

`pip install --force-reinstall --no-deps ./dist/jupyter_anywidget_window_ai-0.0.0-py2.py3-none-any.whl`

Upload to pypi:

`twine upload dist/*0.0.0*`
