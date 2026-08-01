$baseDir = "C:\Users\E-Nat\.gemini\antigravity\scratch\AUBDigitalAcademyFrontend"

# 1. Assets
$assetDirs = @("fonts", "icons", "illustrations", "images", "logos", "backgrounds")
foreach ($dir in $assetDirs) {
    New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "assets\$dir") | Out-Null
}

# 2. CSS
$cssBase = @("reset.css", "typography.css", "variables.css", "global.css")
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "css\base") | Out-Null
foreach ($file in $cssBase) { Set-Content -Path (Join-Path $baseDir "css\base\$file") -Value "/* $file */" }

$cssComponents = @("button.css", "card.css", "form.css", "modal.css", "navbar.css", "sidebar.css", "table.css", "badge.css", "pagination.css", "toast.css")
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "css\components") | Out-Null
foreach ($file in $cssComponents) { Set-Content -Path (Join-Path $baseDir "css\components\$file") -Value "/* $file */" }

$cssLayouts = @("admin.css", "teacher.css", "student.css", "authentication.css")
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "css\layouts") | Out-Null
foreach ($file in $cssLayouts) { Set-Content -Path (Join-Path $baseDir "css\layouts\$file") -Value "/* $file */" }

$cssPages = @("login.css", "dashboard.css", "user-management.css", "academic-management.css", "enrollment-management.css", "course.css", "quiz.css", "assignment.css", "profile.css")
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "css\pages") | Out-Null
foreach ($file in $cssPages) { Set-Content -Path (Join-Path $baseDir "css\pages\$file") -Value "/* $file */" }

# 3. JS
$jsComponents = @("modal.js", "sidebar.js", "dropdown.js", "toast.js", "loading.js")
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "js\components") | Out-Null
foreach ($file in $jsComponents) { Set-Content -Path (Join-Path $baseDir "js\components\$file") -Value "// $file" }

$jsPages = @("login.js", "dashboard.js", "user-management.js", "academic-management.js", "enrollment-management.js")
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "js\pages") | Out-Null
foreach ($file in $jsPages) { Set-Content -Path (Join-Path $baseDir "js\pages\$file") -Value "// $file" }

Set-Content -Path (Join-Path $baseDir "js\app.js") -Value "// app.js"

# 4. Pages
$pagesAuth = @("login.html", "forgot-password.html", "reset-password.html", "login-success.html", "access-denied.html")
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "pages\authentication") | Out-Null
foreach ($file in $pagesAuth) { Set-Content -Path (Join-Path $baseDir "pages\authentication\$file") -Value "<!-- $file -->" }

$pagesAdmin = @("dashboard.html", "user-management.html", "academic-management.html", "enrollment-management.html", "settings.html")
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "pages\admin") | Out-Null
foreach ($file in $pagesAdmin) { Set-Content -Path (Join-Path $baseDir "pages\admin\$file") -Value "<!-- $file -->" }

$pagesTeacher = @("dashboard.html", "my-courses.html", "books.html", "quizzes.html", "assignments.html", "submissions.html", "grades.html")
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "pages\teacher") | Out-Null
foreach ($file in $pagesTeacher) { Set-Content -Path (Join-Path $baseDir "pages\teacher\$file") -Value "<!-- $file -->" }

$pagesStudent = @("dashboard.html", "my-courses.html", "course-detail.html", "book-reader.html", "quiz.html", "assignment.html", "grades.html", "profile.html")
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "pages\student") | Out-Null
foreach ($file in $pagesStudent) { Set-Content -Path (Join-Path $baseDir "pages\student\$file") -Value "<!-- $file -->" }

# 5. Components
$htmlComponents = @("navbar.html", "sidebar.html", "footer.html", "modal.html", "table.html", "breadcrumb.html", "pagination.html", "loading.html", "empty-state.html")
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "components") | Out-Null
foreach ($file in $htmlComponents) { Set-Content -Path (Join-Path $baseDir "components\$file") -Value "<!-- $file -->" }

# 6. Documentation
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "documentation\screenshots") | Out-Null
Set-Content -Path (Join-Path $baseDir "documentation\ui-flow.pdf") -Value ""
Set-Content -Path (Join-Path $baseDir "documentation\data-flow.pdf") -Value ""
Set-Content -Path (Join-Path $baseDir "documentation\design-system.pdf") -Value ""

# 7. Figma
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "figma\exports") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $baseDir "figma\assets") | Out-Null

# 8. Root files
Set-Content -Path (Join-Path $baseDir "index.html") -Value "<!DOCTYPE html>`n<html>`n<head>`n    <title>AUB Digital Academy</title>`n    <script>window.location.href='pages/authentication/login.html';</script>`n</head>`n<body></body>`n</html>"

Set-Content -Path (Join-Path $baseDir ".gitignore") -Value "node_modules/`n.DS_Store`nThumbs.db`n*.log`n.env"

Write-Host "Frontend scaffolding complete!"
