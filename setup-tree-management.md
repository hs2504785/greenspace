# Tree Management System Setup

## Quick Setup Instructions

### 1. Database Migration

You need to run the database migration to create the tree management tables and sample data:

```bash
# If you have direct PostgreSQL access:
psql -h your-supabase-host -U postgres -d postgres -f src/db/migrations/create_tree_management.sql

# Or if using Supabase dashboard:
# 1. Go to your Supabase project dashboard
# 2. Navigate to SQL Editor
# 3. Copy and paste the contents of src/db/migrations/create_tree_management.sql
# 4. Run the SQL
```

### 2. Test the System

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to `/farm-dashboard` in your browser

3. The system should now automatically:
   - Create a default 8-block farm layout
   - Display an interactive 24x24 grid for each block
   - Allow you to click on grid positions to plant trees
   - Show expansion buttons (+) on all sides

### 3. Features Available

#### Farm Dashboard (`/farm-dashboard`)

- **Grid View**: Interactive farm layout with expandable grids
- **Tree List**: View all planted trees
- **Statistics**: Count of healthy, fruiting, and diseased trees

#### Tree Management (`/trees`)

- **CRUD Operations**: Create, Read, Update, Delete trees
- **Tree Codes**: Pre-defined codes (M, L, P, G, AN, CA, A, MB, etc.)
- **Status Tracking**: Healthy, Growing, Flowering, Fruiting, Diseased, Dormant
- **Search & Filter**: Find trees by name, code, or status

#### Tree Details (`/trees/[id]`)

- **Individual Tree Info**: Complete tree profile
- **Care Logs**: Track watering, fertilizing, pruning, etc.
- **Status Updates**: Quick status changes
- **Activity History**: Complete timeline of care activities

### 4. How to Use the Grid

#### Planting Trees

1. Click on any empty grid position (light gray squares)
2. Choose to use an existing tree or create a new one
3. Fill in tree details if creating new
4. Click "Plant Tree"

#### Viewing Tree Details

1. Click on any planted tree (green circles with codes)
2. View complete tree information
3. Add care logs and update status

#### Expanding the Grid

1. Click the **+** buttons on any side of the grid
2. This adds a new row or column of 24x24 blocks
3. The layout automatically adjusts and maintains alignment

### 5. Tree Codes Reference

| Code | Tree Name       | Scientific Name          |
| ---- | --------------- | ------------------------ |
| M    | Mango           | Mangifera indica         |
| L    | Lemon           | Citrus limon             |
| P    | Pomegranate     | Punica granatum          |
| G    | Guava           | Psidium guajava          |
| AN   | Anjeer          | Ficus carica             |
| CA   | Custard Apple   | Annona squamosa          |
| A    | Apple           | Malus domestica          |
| MB   | Mulberry        | Morus nigra              |
| PR   | Pear            | Pyrus communis           |
| JA   | Jackfruit       | Artocarpus heterophyllus |
| MU   | Musambi         | Citrus limetta           |
| O    | Orange          | Citrus sinensis          |
| B    | Barbados Cherry | Malpighia emarginata     |
| AV   | Avocado         | Persea americana         |
| SF   | Starfruit       | Averrhoa carambola       |
| C    | Cashew          | Anacardium occidentale   |
| AM   | Amla            | Phyllanthus emblica      |

### 6. Troubleshooting

If the grid doesn't appear:

1. **Check Database**: Ensure the migration ran successfully
2. **Check Console**: Look for any JavaScript errors in browser console
3. **Check Network**: Verify API calls are working in Network tab
4. **Refresh**: Try refreshing the page after the migration

If you see "No Farm Layout" message:

1. The system should automatically create a default layout
2. If it doesn't, check that the 'farm-1' user exists in your database
3. You can manually run the sample data insert from the migration

### 7. Navigation

The tree management features are accessible through:

- **Main Navigation**: Hamburger menu → "Farm Management" section
- **Dashboard**: Cards for "Farm Management" and "Tree Management"
- **Direct URLs**: `/farm-dashboard`, `/trees`, `/trees/[id]`

The system is now fully functional and ready to use!

