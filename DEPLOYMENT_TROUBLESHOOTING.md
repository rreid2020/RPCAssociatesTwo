# Digital Ocean App Platform Deployment Troubleshooting

## Common Issues and Solutions

### Issue 1: Build Succeeds but App Won't Start

**Solution:** Try using `serve` directly instead of `npx serve`:

- **Run Command:** `serve -s dist -l 8080`

Or add a start script to package.json:

```json
"scripts": {
  "start": "serve -s dist -l 8080"
}
```

Then use:
- **Run Command:** `npm start`

### Issue 2: Cannot Find dist Directory

**Solution:** Ensure the build completes successfully. Check build logs for errors.

Alternative run command:
- **Run Command:** `cd dist && npx serve -s . -l 8080`

### Issue 3: Port Issues

**Solution:** Make sure:
- HTTP Port is set to `8080` in the Ports section
- Run command uses port `8080`

### Issue 4: Buildpack Detection Issues

**Solution:** If using buildpacks, you might need to specify the output directory explicitly.

In App Platform settings, look for:
- **Output Directory:** Set to `dist`

### Issue 5: Missing Dependencies

**Solution:** Ensure `serve` is in dependencies (it is in your package.json).

If issues persist, try moving serve to dependencies explicitly in package.json.

## Alternative Configuration

If the current setup doesn't work, try this:

1. **Build Command:** `npm run build`
2. **Run Command:** `npm start` (after adding start script)
3. **HTTP Port:** `8080`

Or use a Procfile approach (create `Procfile` in root):
```
web: serve -s dist -l 8080
```

Then set:
- **Run Command:** Leave empty (buildpack will use Procfile)




