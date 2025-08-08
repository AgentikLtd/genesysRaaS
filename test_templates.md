# Template Testing Guide

## New Template Features Implemented

### 1. Basic Routing Rule (formerly Simple Template)
- **Location**: Template selector → Templates → Basic Routing Rule
- **Features**:
  - Up to 10 key-value pairs with AND logic
  - Default placeholders: "intent" / "payInvoice"
  - Add rows with + icon (max 10)
  - Delete rows with trash icon (rows 2-10)
  - Warning message when trying to add 11th row
  - Rule name validation (required, must be unique)
  - Target destination and default destination fields
  - **Description**: "Create simple routing rules with multiple conditions that all need to match. Perfect for straightforward call routing based on customer data."

### 2. Smart Routing Rule (formerly Condition Template)
- **Location**: Template selector → Templates → Smart Routing Rule  
- **Features**:
  - Up to 3 AND conditions (all must match)
  - Up to 7 OR conditions (any can match) 
  - Default placeholders: "intent"/"payInvoice" for AND, "customerType"/"premium" for OR
  - Add/delete functionality with appropriate limits
  - Rule name validation (required, must be unique)
  - Target destination and default destination fields
  - **Description**: "Build complex routing logic with both required conditions (AND) and flexible alternatives (OR). Ideal for sophisticated routing scenarios."

## Generated Rule Structure

Both templates generate valid JSON rules that:
1. Include rule name, description, priority
2. Use proper condition structure (all/any operators)
3. Set appropriate destination routing
4. Include event parameters for route determination

## Key Improvements Made

- **Removed Pre-built Templates**: Eliminated confusing pre-built templates that added no real value
- **Streamlined Interface**: Now shows only 2 focused, custom template builders
- **Better Naming**: "Basic Routing Rule" and "Smart Routing Rule" with user-friendly descriptions
- **Search Functionality**: Search works on template names, descriptions, and categories
- **Clean UI**: Larger template cards with clear descriptions and better visual hierarchy

## Integration Points

- Templates integrate with existing TemplateSelector modal
- Rules created through templates navigate to visual editor
- All existing visual editor functions remain intact
- Templates validate against existing rule names
- Search functionality filters templates in real-time

## Test Scenarios

1. **Basic Routing Rule Test**:
   - Select "Basic Routing Rule"
   - Enter rule name "testBasicRule" 
   - Add key-value pair: "intent" → "billing"
   - Set destinations
   - Click Create Rule
   - Verify rule appears in visual editor

2. **Basic Routing Rule Limits Test**:
   - Add 10 key-value pairs
   - Try to add 11th pair
   - Verify warning message appears

3. **Smart Routing Rule Test**:
   - Select "Smart Routing Rule"
   - Add AND condition: "priority" → "high"
   - Add OR condition: "department" → "sales"
   - Set destinations
   - Click Create Rule
   - Verify rule appears in visual editor

4. **Search Functionality Test**:
   - Type "basic" in search box
   - Verify only Basic Routing Rule shows
   - Type "complex" in search box
   - Verify only Smart Routing Rule shows (matches description)
   - Clear search and verify both templates return

5. **Rule Name Validation**:
   - Try to create rule with existing name
   - Verify error message appears
   - Change to unique name and verify success

## Access Instructions

1. Navigate to the Rules Editor page
2. Click "Create New Rule" or template creation button
3. In the modal, you'll see the "Templates" section with search
4. Use search to find templates or click on either template card
5. Fill out the form and click "Create Rule"
6. Rule will be created and visual editor will open