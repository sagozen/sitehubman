param (
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Prompt
)

# Your API Key
$ApiKey = "YOUR_API_KEY"
$Model = "gemini-2.5-pro"
$Url = "https://generativelanguage.googleapis.com/v1beta/models/${Model}:generateContent?key=$ApiKey"

# Create the JSON payload
$BodyObj = @{
    contents = @(
        @{
            parts = @(
                @{
                    text = $Prompt
                }
            )
        }
    )
}

$JsonBody = $BodyObj | ConvertTo-Json -Depth 10

Write-Host "Thinking..." -ForegroundColor Cyan

try {
    # Send the request
    $Response = Invoke-RestMethod -Uri $Url -Method Post -Body $JsonBody -ContentType "application/json"
    
    # Extract and print the response
    $Answer = $Response.candidates[0].content.parts[0].text
    Write-Host ""
    Write-Host $Answer -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "Error: Failed to get response from Gemini." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq "TooManyRequests") {
        Write-Host "Reason: Your API key is currently out of quota (429 Too Many Requests). Please wait for the rate limit to reset." -ForegroundColor Yellow
    }
}
