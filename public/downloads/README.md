# Downloads Directory

This directory contains downloadable files for the RPC Associates website.

## Excel Templates

Place Excel calculator templates in the `excel-templates/` subdirectory.

### File Structure

```
downloads/
  excel-templates/
    tax-calculator-2025.xlsx
    budget-calculator.xlsx
    expense-tracker.xlsx
```

### Adding Files

1. Place your `.xlsx` files in `excel-templates/`
2. Update `src/pages/Resources.tsx` to add the resource entry
3. Files will be available at: `https://rpcassociates.co/downloads/excel-templates/your-file.xlsx`

### Best Practices

- Use descriptive, lowercase filenames with hyphens
- Include year if applicable (e.g., `tax-calculator-2025.xlsx`)
- Keep file sizes reasonable (< 5MB recommended)
- Test downloads after deployment
