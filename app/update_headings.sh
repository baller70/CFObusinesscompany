#!/bin/bash

# Function to update headings in a file
update_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Updating headings in $file..."
        
        # Update common CardTitle headings
        sed -i 's/>Recent Transactions</>' RECENT TRANSACTIONS'</g' "$file"
        sed -i 's/>Upcoming Bills</>' UPCOMING BILLS'</g' "$file"
        sed -i 's/>Upcoming Tasks</>' UPCOMING TASKS'</g' "$file"
        sed -i 's/>Quick Actions</>' QUICK ACTIONS'</g' "$file"
        sed -i 's/>Financial Overview</>' FINANCIAL OVERVIEW'</g' "$file"
        sed -i 's/>Progress Overview</>' PROGRESS OVERVIEW'</g' "$file"
        sed -i 's/>Business Overview</>' BUSINESS OVERVIEW'</g' "$file"
        sed -i 's/>AI CFO Chat</>' AI CFO CHAT'</g' "$file"
        sed -i 's/>Debt Reduction Plan</>' DEBT REDUCTION PLAN'</g' "$file"
        sed -i 's/>Goal Progress</>' GOAL PROGRESS'</g' "$file"
        
        # Update h1, h2, h3 headings (be more careful with these)
        sed -i 's/<h1[^>]*>Create New/<h1[^>]*>CREATE NEW/g' "$file"
        sed -i 's/<h1[^>]*>Edit/<h1[^>]*>EDIT/g' "$file"
        sed -i 's/<h2[^>]*>Settings/<h2[^>]*>SETTINGS/g' "$file"
        sed -i 's/<h3[^>]*>Overview/<h3[^>]*>OVERVIEW/g' "$file"
        
        echo "Updated $file"
    fi
}

# Update key dashboard components
update_file "./components/dashboard/recent-transactions.tsx"
update_file "./components/dashboard/upcoming-bills.tsx"
update_file "./components/dashboard/upcoming-tasks.tsx"
update_file "./components/dashboard/quick-actions.tsx"
update_file "./components/dashboard/financial-overview.tsx"
update_file "./components/dashboard/progress-section.tsx"
update_file "./components/dashboard/business-overview.tsx"
update_file "./components/cfo-ai/cfo-chat-dialog.tsx"
update_file "./components/cfo-ai/debt-reduction-planner.tsx"

echo "Done updating dashboard components!"
