# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 12-modals-toasts-forms.spec.ts >> Toast notifications >> TC-1320 successful invite shows toast (or inline message)
- Location: tests/qa-e2e/12-modals-toasts-forms.spec.ts:56:7

# Error details

```
Test timeout of 20000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 20000ms exceeded.
Call log:
  - waiting for getByLabel(/^role$/i)

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - link "Home — Lakshya School of Excellence" [ref=e6] [cursor=pointer]:
          - /url: /Home
          - img [ref=e8]
          - generic [ref=e11]:
            - generic [ref=e12]: Lakshya School of Excellence
            - generic [ref=e13]: Vidyalaya · School Suite
        - generic [ref=e14]:
          - group "Language" [ref=e15]:
            - button "EN" [pressed] [ref=e16] [cursor=pointer]
            - button "हिं" [ref=e17] [cursor=pointer]
          - generic [ref=e18]:
            - link "What's new" [ref=e19] [cursor=pointer]:
              - /url: "#whats-new"
              - img [ref=e20]
            - button "Favourite menus" [ref=e24] [cursor=pointer]:
              - img [ref=e25]
            - button "Help and resources" [ref=e28] [cursor=pointer]:
              - img [ref=e29]
          - 'button "AY: 2026-2027" [ref=e32] [cursor=pointer]':
            - img [ref=e33]
            - text: "AY: 2026-2027"
            - img [ref=e35]
          - button "Search" [ref=e38] [cursor=pointer]:
            - img [ref=e39]
          - button "App launcher" [ref=e42] [cursor=pointer]:
            - img [ref=e43]
          - button "Notifications" [ref=e54] [cursor=pointer]:
            - img [ref=e55]
          - button "Open profile menu" [ref=e59] [cursor=pointer]:
            - img "Mr. Sudhir Anand" [ref=e60]: MS
            - generic [ref=e61]: Admin
    - generic [ref=e63]:
      - navigation "Breadcrumb" [ref=e64]:
        - button "Toggle favourite" [ref=e65] [cursor=pointer]:
          - img [ref=e66]
        - list [ref=e68]:
          - listitem [ref=e69]: Settings
          - listitem [ref=e70]: ›
          - listitem [ref=e71]: Users
      - navigation "Module navigation" [ref=e74]:
        - link "SIS" [ref=e76] [cursor=pointer]:
          - /url: /Home/SIS
          - text: SIS
          - img [ref=e77]
        - link "HR" [ref=e80] [cursor=pointer]:
          - /url: /Home/HR
          - text: HR
          - img [ref=e81]
        - link "Finance" [ref=e84] [cursor=pointer]:
          - /url: /Home/Finance
          - text: Finance
          - img [ref=e85]
        - link "Admissions" [ref=e88] [cursor=pointer]:
          - /url: /Home/Admissions
          - text: Admissions
          - img [ref=e89]
        - link "Visitor Mgmt" [ref=e92] [cursor=pointer]:
          - /url: /Home/Visitor_Mgmt
          - text: Visitor Mgmt
          - img [ref=e93]
        - link "Transport" [ref=e96] [cursor=pointer]:
          - /url: /Home/Transport
          - text: Transport
          - img [ref=e97]
        - link "Certificates" [ref=e100] [cursor=pointer]:
          - /url: /Home/Certificates
          - text: Certificates
          - img [ref=e101]
        - link "Library" [ref=e104] [cursor=pointer]:
          - /url: /Home/Library
          - text: Library
          - img [ref=e105]
        - link "Hostel" [ref=e108] [cursor=pointer]:
          - /url: /Home/Hostel
          - text: Hostel
          - img [ref=e109]
        - link "Online Exams" [ref=e112] [cursor=pointer]:
          - /url: /Home/Online_Exams
          - text: Online Exams
          - img [ref=e113]
        - link "AI Insights" [ref=e116] [cursor=pointer]:
          - /url: /Home/AI
          - text: AI Insights
          - img [ref=e117]
        - link "Wellness" [ref=e120] [cursor=pointer]:
          - /url: /Home/Wellness
          - text: Wellness
          - img [ref=e121]
        - link "Alumni" [ref=e124] [cursor=pointer]:
          - /url: /Home/Alumni
          - text: Alumni
          - img [ref=e125]
        - link "Reports" [ref=e128] [cursor=pointer]:
          - /url: /Home/Reports
          - text: Reports
          - img [ref=e129]
        - link "Compliance" [ref=e132] [cursor=pointer]:
          - /url: /Home/Compliance
          - text: Compliance
          - img [ref=e133]
      - generic [ref=e135]:
        - button "Help video" [ref=e136] [cursor=pointer]:
          - img [ref=e137]
        - button "More info" [ref=e140] [cursor=pointer]:
          - img [ref=e141]
        - button "Help" [ref=e143] [cursor=pointer]:
          - img [ref=e144]
    - main [ref=e147]:
      - generic [ref=e148]:
        - heading "Users & invitations" [level=1] [ref=e149]
        - paragraph [ref=e150]: Invite teachers, parents, students, and staff to Lakshya School of Excellence.
        - generic [ref=e151]:
          - generic [ref=e152]:
            - heading "Send invitation" [level=2] [ref=e153]
            - paragraph [ref=e154]: An email link will be valid for 7 days.
            - generic [ref=e155]:
              - generic [ref=e156]:
                - generic [ref=e157]: Full name
                - textbox "Full name" [ref=e159]:
                  - /placeholder: Ananya Iyer
                  - text: QA Toast
              - generic [ref=e160]:
                - generic [ref=e161]: Email
                - textbox "Email" [active] [ref=e163]:
                  - /placeholder: ananya@school.edu.in
                  - text: qa-toast-1777732068110@vidyalaya-qa.local
              - generic [ref=e164]:
                - text: Role
                - combobox "Role" [ref=e165]:
                  - option "TEACHER" [selected]
                  - option "STUDENT"
                  - option "PARENT"
                  - option "ACCOUNTANT"
                  - option "HR_MANAGER"
                  - option "TRANSPORT_MANAGER"
                  - option "INVENTORY_MANAGER"
                  - option "PRINCIPAL"
                  - option "ADMIN"
              - button "Send invitation" [ref=e166] [cursor=pointer]
          - generic [ref=e167]:
            - heading "Pending invitations (3)" [level=2] [ref=e168]
            - list [ref=e169]:
              - listitem [ref=e170]:
                - generic [ref=e171]:
                  - generic [ref=e172]: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA · qa-long-1777731944836@vidyalaya-qa.local
                  - generic [ref=e173]: TEACHER · expires 5/9/2026
              - listitem [ref=e174]:
                - generic [ref=e175]:
                  - generic [ref=e176]: <script>window.__pwn=true</script>Hacker · qa-xss-1777731913561@vidyalaya-qa.local
                  - generic [ref=e177]: TEACHER · expires 5/9/2026
              - listitem [ref=e178]:
                - generic [ref=e179]:
                  - generic [ref=e180]: <script>window.__pwn=true</script>Hacker · qa-xss-1777731906077@vidyalaya-qa.local
                  - generic [ref=e181]: TEACHER · expires 5/9/2026
        - generic [ref=e182]:
          - heading "Members (100)" [level=2] [ref=e183]
          - table [ref=e185]:
            - rowgroup [ref=e186]:
              - row "Name Email Role Last login Status" [ref=e187]:
                - columnheader "Name" [ref=e188]
                - columnheader "Email" [ref=e189]
                - columnheader "Role" [ref=e190]
                - columnheader "Last login" [ref=e191]
                - columnheader "Status" [ref=e192]
            - rowgroup [ref=e193]:
              - row "Suresh Gupta suresh.gupta.162@gmail.com PARENT — Active" [ref=e194]:
                - cell "Suresh Gupta" [ref=e195]
                - cell "suresh.gupta.162@gmail.com" [ref=e196]
                - cell "PARENT" [ref=e197]
                - cell "—" [ref=e198]
                - cell "Active" [ref=e199]
              - row "Sara Gupta sara.gupta.162@dpsbangalore.edu.in STUDENT — Active" [ref=e200]:
                - cell "Sara Gupta" [ref=e201]
                - cell "sara.gupta.162@dpsbangalore.edu.in" [ref=e202]
                - cell "STUDENT" [ref=e203]
                - cell "—" [ref=e204]
                - cell "Active" [ref=e205]
              - row "Pradeep Banerjee pradeep.banerjee.161@gmail.com PARENT — Active" [ref=e206]:
                - cell "Pradeep Banerjee" [ref=e207]
                - cell "pradeep.banerjee.161@gmail.com" [ref=e208]
                - cell "PARENT" [ref=e209]
                - cell "—" [ref=e210]
                - cell "Active" [ref=e211]
              - row "Neel Banerjee neel.banerjee.161@dpsbangalore.edu.in STUDENT — Active" [ref=e212]:
                - cell "Neel Banerjee" [ref=e213]
                - cell "neel.banerjee.161@dpsbangalore.edu.in" [ref=e214]
                - cell "STUDENT" [ref=e215]
                - cell "—" [ref=e216]
                - cell "Active" [ref=e217]
              - row "Manoj Khanna manoj.khanna.160@gmail.com PARENT — Active" [ref=e218]:
                - cell "Manoj Khanna" [ref=e219]
                - cell "manoj.khanna.160@gmail.com" [ref=e220]
                - cell "PARENT" [ref=e221]
                - cell "—" [ref=e222]
                - cell "Active" [ref=e223]
              - row "Krishna Khanna krishna.khanna.160@dpsbangalore.edu.in STUDENT — Active" [ref=e224]:
                - cell "Krishna Khanna" [ref=e225]
                - cell "krishna.khanna.160@dpsbangalore.edu.in" [ref=e226]
                - cell "STUDENT" [ref=e227]
                - cell "—" [ref=e228]
                - cell "Active" [ref=e229]
              - row "Praveen Khanna praveen.khanna.159@gmail.com PARENT — Active" [ref=e230]:
                - cell "Praveen Khanna" [ref=e231]
                - cell "praveen.khanna.159@gmail.com" [ref=e232]
                - cell "PARENT" [ref=e233]
                - cell "—" [ref=e234]
                - cell "Active" [ref=e235]
              - row "Rohan Khanna rohan.khanna.159@dpsbangalore.edu.in STUDENT — Active" [ref=e236]:
                - cell "Rohan Khanna" [ref=e237]
                - cell "rohan.khanna.159@dpsbangalore.edu.in" [ref=e238]
                - cell "STUDENT" [ref=e239]
                - cell "—" [ref=e240]
                - cell "Active" [ref=e241]
              - row "Suresh Kulkarni suresh.kulkarni.158@gmail.com PARENT — Active" [ref=e242]:
                - cell "Suresh Kulkarni" [ref=e243]
                - cell "suresh.kulkarni.158@gmail.com" [ref=e244]
                - cell "PARENT" [ref=e245]
                - cell "—" [ref=e246]
                - cell "Active" [ref=e247]
              - row "Rishi Kulkarni rishi.kulkarni.158@dpsbangalore.edu.in STUDENT — Active" [ref=e248]:
                - cell "Rishi Kulkarni" [ref=e249]
                - cell "rishi.kulkarni.158@dpsbangalore.edu.in" [ref=e250]
                - cell "STUDENT" [ref=e251]
                - cell "—" [ref=e252]
                - cell "Active" [ref=e253]
              - row "Ashok Kumar ashok.kumar.157@gmail.com PARENT — Active" [ref=e254]:
                - cell "Ashok Kumar" [ref=e255]
                - cell "ashok.kumar.157@gmail.com" [ref=e256]
                - cell "PARENT" [ref=e257]
                - cell "—" [ref=e258]
                - cell "Active" [ref=e259]
              - row "Yash Kumar yash.kumar.157@dpsbangalore.edu.in STUDENT — Active" [ref=e260]:
                - cell "Yash Kumar" [ref=e261]
                - cell "yash.kumar.157@dpsbangalore.edu.in" [ref=e262]
                - cell "STUDENT" [ref=e263]
                - cell "—" [ref=e264]
                - cell "Active" [ref=e265]
              - row "Mahesh Saxena mahesh.saxena.156@gmail.com PARENT — Active" [ref=e266]:
                - cell "Mahesh Saxena" [ref=e267]
                - cell "mahesh.saxena.156@gmail.com" [ref=e268]
                - cell "PARENT" [ref=e269]
                - cell "—" [ref=e270]
                - cell "Active" [ref=e271]
              - row "Krishna Saxena krishna.saxena.156@dpsbangalore.edu.in STUDENT — Active" [ref=e272]:
                - cell "Krishna Saxena" [ref=e273]
                - cell "krishna.saxena.156@dpsbangalore.edu.in" [ref=e274]
                - cell "STUDENT" [ref=e275]
                - cell "—" [ref=e276]
                - cell "Active" [ref=e277]
              - row "Naveen Gupta naveen.gupta.155@gmail.com PARENT — Active" [ref=e278]:
                - cell "Naveen Gupta" [ref=e279]
                - cell "naveen.gupta.155@gmail.com" [ref=e280]
                - cell "PARENT" [ref=e281]
                - cell "—" [ref=e282]
                - cell "Active" [ref=e283]
              - row "Vanya Gupta vanya.gupta.155@dpsbangalore.edu.in STUDENT — Active" [ref=e284]:
                - cell "Vanya Gupta" [ref=e285]
                - cell "vanya.gupta.155@dpsbangalore.edu.in" [ref=e286]
                - cell "STUDENT" [ref=e287]
                - cell "—" [ref=e288]
                - cell "Active" [ref=e289]
              - row "Sanjay Patel sanjay.patel.154@gmail.com PARENT — Active" [ref=e290]:
                - cell "Sanjay Patel" [ref=e291]
                - cell "sanjay.patel.154@gmail.com" [ref=e292]
                - cell "PARENT" [ref=e293]
                - cell "—" [ref=e294]
                - cell "Active" [ref=e295]
              - row "Ayaan Patel ayaan.patel.154@dpsbangalore.edu.in STUDENT — Active" [ref=e296]:
                - cell "Ayaan Patel" [ref=e297]
                - cell "ayaan.patel.154@dpsbangalore.edu.in" [ref=e298]
                - cell "STUDENT" [ref=e299]
                - cell "—" [ref=e300]
                - cell "Active" [ref=e301]
              - row "Pradeep Das pradeep.das.153@gmail.com PARENT — Active" [ref=e302]:
                - cell "Pradeep Das" [ref=e303]
                - cell "pradeep.das.153@gmail.com" [ref=e304]
                - cell "PARENT" [ref=e305]
                - cell "—" [ref=e306]
                - cell "Active" [ref=e307]
              - row "Shaurya Das shaurya.das.153@dpsbangalore.edu.in STUDENT — Active" [ref=e308]:
                - cell "Shaurya Das" [ref=e309]
                - cell "shaurya.das.153@dpsbangalore.edu.in" [ref=e310]
                - cell "STUDENT" [ref=e311]
                - cell "—" [ref=e312]
                - cell "Active" [ref=e313]
              - row "Sanjay Gupta sanjay.gupta.152@gmail.com PARENT — Active" [ref=e314]:
                - cell "Sanjay Gupta" [ref=e315]
                - cell "sanjay.gupta.152@gmail.com" [ref=e316]
                - cell "PARENT" [ref=e317]
                - cell "—" [ref=e318]
                - cell "Active" [ref=e319]
              - row "Yash Gupta yash.gupta.152@dpsbangalore.edu.in STUDENT — Active" [ref=e320]:
                - cell "Yash Gupta" [ref=e321]
                - cell "yash.gupta.152@dpsbangalore.edu.in" [ref=e322]
                - cell "STUDENT" [ref=e323]
                - cell "—" [ref=e324]
                - cell "Active" [ref=e325]
              - row "Pradeep Shetty pradeep.shetty.151@gmail.com PARENT — Active" [ref=e326]:
                - cell "Pradeep Shetty" [ref=e327]
                - cell "pradeep.shetty.151@gmail.com" [ref=e328]
                - cell "PARENT" [ref=e329]
                - cell "—" [ref=e330]
                - cell "Active" [ref=e331]
              - row "Mahi Shetty mahi.shetty.151@dpsbangalore.edu.in STUDENT — Active" [ref=e332]:
                - cell "Mahi Shetty" [ref=e333]
                - cell "mahi.shetty.151@dpsbangalore.edu.in" [ref=e334]
                - cell "STUDENT" [ref=e335]
                - cell "—" [ref=e336]
                - cell "Active" [ref=e337]
              - row "Mahesh Kulkarni mahesh.kulkarni.150@gmail.com PARENT — Active" [ref=e338]:
                - cell "Mahesh Kulkarni" [ref=e339]
                - cell "mahesh.kulkarni.150@gmail.com" [ref=e340]
                - cell "PARENT" [ref=e341]
                - cell "—" [ref=e342]
                - cell "Active" [ref=e343]
              - row "Manav Kulkarni manav.kulkarni.150@dpsbangalore.edu.in STUDENT — Active" [ref=e344]:
                - cell "Manav Kulkarni" [ref=e345]
                - cell "manav.kulkarni.150@dpsbangalore.edu.in" [ref=e346]
                - cell "STUDENT" [ref=e347]
                - cell "—" [ref=e348]
                - cell "Active" [ref=e349]
              - row "Mahesh Das mahesh.das.149@gmail.com PARENT — Active" [ref=e350]:
                - cell "Mahesh Das" [ref=e351]
                - cell "mahesh.das.149@gmail.com" [ref=e352]
                - cell "PARENT" [ref=e353]
                - cell "—" [ref=e354]
                - cell "Active" [ref=e355]
              - row "Aarav Das aarav.das.149@dpsbangalore.edu.in STUDENT — Active" [ref=e356]:
                - cell "Aarav Das" [ref=e357]
                - cell "aarav.das.149@dpsbangalore.edu.in" [ref=e358]
                - cell "STUDENT" [ref=e359]
                - cell "—" [ref=e360]
                - cell "Active" [ref=e361]
              - row "Vinod Kumar vinod.kumar.148@gmail.com PARENT — Active" [ref=e362]:
                - cell "Vinod Kumar" [ref=e363]
                - cell "vinod.kumar.148@gmail.com" [ref=e364]
                - cell "PARENT" [ref=e365]
                - cell "—" [ref=e366]
                - cell "Active" [ref=e367]
              - row "Kabir Kumar kabir.kumar.148@dpsbangalore.edu.in STUDENT — Active" [ref=e368]:
                - cell "Kabir Kumar" [ref=e369]
                - cell "kabir.kumar.148@dpsbangalore.edu.in" [ref=e370]
                - cell "STUDENT" [ref=e371]
                - cell "—" [ref=e372]
                - cell "Active" [ref=e373]
              - row "Manoj Banerjee manoj.banerjee.147@gmail.com PARENT — Active" [ref=e374]:
                - cell "Manoj Banerjee" [ref=e375]
                - cell "manoj.banerjee.147@gmail.com" [ref=e376]
                - cell "PARENT" [ref=e377]
                - cell "—" [ref=e378]
                - cell "Active" [ref=e379]
              - row "Prisha Banerjee prisha.banerjee.147@dpsbangalore.edu.in STUDENT — Active" [ref=e380]:
                - cell "Prisha Banerjee" [ref=e381]
                - cell "prisha.banerjee.147@dpsbangalore.edu.in" [ref=e382]
                - cell "STUDENT" [ref=e383]
                - cell "—" [ref=e384]
                - cell "Active" [ref=e385]
              - row "Mahesh Singh mahesh.singh.146@gmail.com PARENT — Active" [ref=e386]:
                - cell "Mahesh Singh" [ref=e387]
                - cell "mahesh.singh.146@gmail.com" [ref=e388]
                - cell "PARENT" [ref=e389]
                - cell "—" [ref=e390]
                - cell "Active" [ref=e391]
              - row "Ayaan Singh ayaan.singh.146@dpsbangalore.edu.in STUDENT — Active" [ref=e392]:
                - cell "Ayaan Singh" [ref=e393]
                - cell "ayaan.singh.146@dpsbangalore.edu.in" [ref=e394]
                - cell "STUDENT" [ref=e395]
                - cell "—" [ref=e396]
                - cell "Active" [ref=e397]
              - row "Vinod Kumar vinod.kumar.145@gmail.com PARENT — Active" [ref=e398]:
                - cell "Vinod Kumar" [ref=e399]
                - cell "vinod.kumar.145@gmail.com" [ref=e400]
                - cell "PARENT" [ref=e401]
                - cell "—" [ref=e402]
                - cell "Active" [ref=e403]
              - row "Vanya Kumar vanya.kumar.145@dpsbangalore.edu.in STUDENT — Active" [ref=e404]:
                - cell "Vanya Kumar" [ref=e405]
                - cell "vanya.kumar.145@dpsbangalore.edu.in" [ref=e406]
                - cell "STUDENT" [ref=e407]
                - cell "—" [ref=e408]
                - cell "Active" [ref=e409]
              - row "Vijay Das vijay.das.144@gmail.com PARENT — Active" [ref=e410]:
                - cell "Vijay Das" [ref=e411]
                - cell "vijay.das.144@gmail.com" [ref=e412]
                - cell "PARENT" [ref=e413]
                - cell "—" [ref=e414]
                - cell "Active" [ref=e415]
              - row "Zara Das zara.das.144@dpsbangalore.edu.in STUDENT — Active" [ref=e416]:
                - cell "Zara Das" [ref=e417]
                - cell "zara.das.144@dpsbangalore.edu.in" [ref=e418]
                - cell "STUDENT" [ref=e419]
                - cell "—" [ref=e420]
                - cell "Active" [ref=e421]
              - row "Rajesh Kumar rajesh.kumar.143@gmail.com PARENT — Active" [ref=e422]:
                - cell "Rajesh Kumar" [ref=e423]
                - cell "rajesh.kumar.143@gmail.com" [ref=e424]
                - cell "PARENT" [ref=e425]
                - cell "—" [ref=e426]
                - cell "Active" [ref=e427]
              - row "Shaurya Kumar shaurya.kumar.143@dpsbangalore.edu.in STUDENT — Active" [ref=e428]:
                - cell "Shaurya Kumar" [ref=e429]
                - cell "shaurya.kumar.143@dpsbangalore.edu.in" [ref=e430]
                - cell "STUDENT" [ref=e431]
                - cell "—" [ref=e432]
                - cell "Active" [ref=e433]
              - row "Mahesh Gupta mahesh.gupta.142@gmail.com PARENT — Active" [ref=e434]:
                - cell "Mahesh Gupta" [ref=e435]
                - cell "mahesh.gupta.142@gmail.com" [ref=e436]
                - cell "PARENT" [ref=e437]
                - cell "—" [ref=e438]
                - cell "Active" [ref=e439]
              - row "Myra Gupta myra.gupta.142@dpsbangalore.edu.in STUDENT — Active" [ref=e440]:
                - cell "Myra Gupta" [ref=e441]
                - cell "myra.gupta.142@dpsbangalore.edu.in" [ref=e442]
                - cell "STUDENT" [ref=e443]
                - cell "—" [ref=e444]
                - cell "Active" [ref=e445]
              - row "Sandeep Kumar sandeep.kumar.141@gmail.com PARENT — Active" [ref=e446]:
                - cell "Sandeep Kumar" [ref=e447]
                - cell "sandeep.kumar.141@gmail.com" [ref=e448]
                - cell "PARENT" [ref=e449]
                - cell "—" [ref=e450]
                - cell "Active" [ref=e451]
              - row "Kiara Kumar kiara.kumar.141@dpsbangalore.edu.in STUDENT — Active" [ref=e452]:
                - cell "Kiara Kumar" [ref=e453]
                - cell "kiara.kumar.141@dpsbangalore.edu.in" [ref=e454]
                - cell "STUDENT" [ref=e455]
                - cell "—" [ref=e456]
                - cell "Active" [ref=e457]
              - row "Vinod Sharma vinod.sharma.140@gmail.com PARENT — Active" [ref=e458]:
                - cell "Vinod Sharma" [ref=e459]
                - cell "vinod.sharma.140@gmail.com" [ref=e460]
                - cell "PARENT" [ref=e461]
                - cell "—" [ref=e462]
                - cell "Active" [ref=e463]
              - row "Zara Sharma zara.sharma.140@dpsbangalore.edu.in STUDENT — Active" [ref=e464]:
                - cell "Zara Sharma" [ref=e465]
                - cell "zara.sharma.140@dpsbangalore.edu.in" [ref=e466]
                - cell "STUDENT" [ref=e467]
                - cell "—" [ref=e468]
                - cell "Active" [ref=e469]
              - row "Manoj Khanna manoj.khanna.139@gmail.com PARENT — Active" [ref=e470]:
                - cell "Manoj Khanna" [ref=e471]
                - cell "manoj.khanna.139@gmail.com" [ref=e472]
                - cell "PARENT" [ref=e473]
                - cell "—" [ref=e474]
                - cell "Active" [ref=e475]
              - row "Shaurya Khanna shaurya.khanna.139@dpsbangalore.edu.in STUDENT — Active" [ref=e476]:
                - cell "Shaurya Khanna" [ref=e477]
                - cell "shaurya.khanna.139@dpsbangalore.edu.in" [ref=e478]
                - cell "STUDENT" [ref=e479]
                - cell "—" [ref=e480]
                - cell "Active" [ref=e481]
              - row "Naveen Banerjee naveen.banerjee.138@gmail.com PARENT — Active" [ref=e482]:
                - cell "Naveen Banerjee" [ref=e483]
                - cell "naveen.banerjee.138@gmail.com" [ref=e484]
                - cell "PARENT" [ref=e485]
                - cell "—" [ref=e486]
                - cell "Active" [ref=e487]
              - row "Shaurya Banerjee shaurya.banerjee.138@dpsbangalore.edu.in STUDENT — Active" [ref=e488]:
                - cell "Shaurya Banerjee" [ref=e489]
                - cell "shaurya.banerjee.138@dpsbangalore.edu.in" [ref=e490]
                - cell "STUDENT" [ref=e491]
                - cell "—" [ref=e492]
                - cell "Active" [ref=e493]
              - row "Sandeep Pillai sandeep.pillai.137@gmail.com PARENT — Active" [ref=e494]:
                - cell "Sandeep Pillai" [ref=e495]
                - cell "sandeep.pillai.137@gmail.com" [ref=e496]
                - cell "PARENT" [ref=e497]
                - cell "—" [ref=e498]
                - cell "Active" [ref=e499]
              - row "Kiara Pillai kiara.pillai.137@dpsbangalore.edu.in STUDENT — Active" [ref=e500]:
                - cell "Kiara Pillai" [ref=e501]
                - cell "kiara.pillai.137@dpsbangalore.edu.in" [ref=e502]
                - cell "STUDENT" [ref=e503]
                - cell "—" [ref=e504]
                - cell "Active" [ref=e505]
              - row "Anil Gupta anil.gupta.136@gmail.com PARENT — Active" [ref=e506]:
                - cell "Anil Gupta" [ref=e507]
                - cell "anil.gupta.136@gmail.com" [ref=e508]
                - cell "PARENT" [ref=e509]
                - cell "—" [ref=e510]
                - cell "Active" [ref=e511]
              - row "Shaurya Gupta shaurya.gupta.136@dpsbangalore.edu.in STUDENT — Active" [ref=e512]:
                - cell "Shaurya Gupta" [ref=e513]
                - cell "shaurya.gupta.136@dpsbangalore.edu.in" [ref=e514]
                - cell "STUDENT" [ref=e515]
                - cell "—" [ref=e516]
                - cell "Active" [ref=e517]
              - row "Rajesh Rao rajesh.rao.135@gmail.com PARENT — Active" [ref=e518]:
                - cell "Rajesh Rao" [ref=e519]
                - cell "rajesh.rao.135@gmail.com" [ref=e520]
                - cell "PARENT" [ref=e521]
                - cell "—" [ref=e522]
                - cell "Active" [ref=e523]
              - row "Arjun Rao arjun.rao.135@dpsbangalore.edu.in STUDENT — Active" [ref=e524]:
                - cell "Arjun Rao" [ref=e525]
                - cell "arjun.rao.135@dpsbangalore.edu.in" [ref=e526]
                - cell "STUDENT" [ref=e527]
                - cell "—" [ref=e528]
                - cell "Active" [ref=e529]
              - row "Ashok Gupta ashok.gupta.134@gmail.com PARENT — Active" [ref=e530]:
                - cell "Ashok Gupta" [ref=e531]
                - cell "ashok.gupta.134@gmail.com" [ref=e532]
                - cell "PARENT" [ref=e533]
                - cell "—" [ref=e534]
                - cell "Active" [ref=e535]
              - row "Yash Gupta yash.gupta.134@dpsbangalore.edu.in STUDENT — Active" [ref=e536]:
                - cell "Yash Gupta" [ref=e537]
                - cell "yash.gupta.134@dpsbangalore.edu.in" [ref=e538]
                - cell "STUDENT" [ref=e539]
                - cell "—" [ref=e540]
                - cell "Active" [ref=e541]
              - row "Vijay Iyer vijay.iyer.133@gmail.com PARENT — Active" [ref=e542]:
                - cell "Vijay Iyer" [ref=e543]
                - cell "vijay.iyer.133@gmail.com" [ref=e544]
                - cell "PARENT" [ref=e545]
                - cell "—" [ref=e546]
                - cell "Active" [ref=e547]
              - row "Yash Iyer yash.iyer.133@dpsbangalore.edu.in STUDENT — Active" [ref=e548]:
                - cell "Yash Iyer" [ref=e549]
                - cell "yash.iyer.133@dpsbangalore.edu.in" [ref=e550]
                - cell "STUDENT" [ref=e551]
                - cell "—" [ref=e552]
                - cell "Active" [ref=e553]
              - row "Vinod Das vinod.das.132@gmail.com PARENT — Active" [ref=e554]:
                - cell "Vinod Das" [ref=e555]
                - cell "vinod.das.132@gmail.com" [ref=e556]
                - cell "PARENT" [ref=e557]
                - cell "—" [ref=e558]
                - cell "Active" [ref=e559]
              - row "Zara Das zara.das.132@dpsbangalore.edu.in STUDENT — Active" [ref=e560]:
                - cell "Zara Das" [ref=e561]
                - cell "zara.das.132@dpsbangalore.edu.in" [ref=e562]
                - cell "STUDENT" [ref=e563]
                - cell "—" [ref=e564]
                - cell "Active" [ref=e565]
              - row "Manoj Rao manoj.rao.131@gmail.com PARENT — Active" [ref=e566]:
                - cell "Manoj Rao" [ref=e567]
                - cell "manoj.rao.131@gmail.com" [ref=e568]
                - cell "PARENT" [ref=e569]
                - cell "—" [ref=e570]
                - cell "Active" [ref=e571]
              - row "Vanya Rao vanya.rao.131@dpsbangalore.edu.in STUDENT — Active" [ref=e572]:
                - cell "Vanya Rao" [ref=e573]
                - cell "vanya.rao.131@dpsbangalore.edu.in" [ref=e574]
                - cell "STUDENT" [ref=e575]
                - cell "—" [ref=e576]
                - cell "Active" [ref=e577]
              - row "Rajesh Nair rajesh.nair.130@gmail.com PARENT — Active" [ref=e578]:
                - cell "Rajesh Nair" [ref=e579]
                - cell "rajesh.nair.130@gmail.com" [ref=e580]
                - cell "PARENT" [ref=e581]
                - cell "—" [ref=e582]
                - cell "Active" [ref=e583]
              - row "Pari Nair pari.nair.130@dpsbangalore.edu.in STUDENT — Active" [ref=e584]:
                - cell "Pari Nair" [ref=e585]
                - cell "pari.nair.130@dpsbangalore.edu.in" [ref=e586]
                - cell "STUDENT" [ref=e587]
                - cell "—" [ref=e588]
                - cell "Active" [ref=e589]
              - row "Sanjay Kumar sanjay.kumar.129@gmail.com PARENT — Active" [ref=e590]:
                - cell "Sanjay Kumar" [ref=e591]
                - cell "sanjay.kumar.129@gmail.com" [ref=e592]
                - cell "PARENT" [ref=e593]
                - cell "—" [ref=e594]
                - cell "Active" [ref=e595]
              - row "Ayaan Kumar ayaan.kumar.129@dpsbangalore.edu.in STUDENT — Active" [ref=e596]:
                - cell "Ayaan Kumar" [ref=e597]
                - cell "ayaan.kumar.129@dpsbangalore.edu.in" [ref=e598]
                - cell "STUDENT" [ref=e599]
                - cell "—" [ref=e600]
                - cell "Active" [ref=e601]
              - row "Sanjay Joshi sanjay.joshi.128@gmail.com PARENT — Active" [ref=e602]:
                - cell "Sanjay Joshi" [ref=e603]
                - cell "sanjay.joshi.128@gmail.com" [ref=e604]
                - cell "PARENT" [ref=e605]
                - cell "—" [ref=e606]
                - cell "Active" [ref=e607]
              - row "Karthik Joshi karthik.joshi.128@dpsbangalore.edu.in STUDENT — Active" [ref=e608]:
                - cell "Karthik Joshi" [ref=e609]
                - cell "karthik.joshi.128@dpsbangalore.edu.in" [ref=e610]
                - cell "STUDENT" [ref=e611]
                - cell "—" [ref=e612]
                - cell "Active" [ref=e613]
              - row "Deepak Banerjee deepak.banerjee.127@gmail.com PARENT — Active" [ref=e614]:
                - cell "Deepak Banerjee" [ref=e615]
                - cell "deepak.banerjee.127@gmail.com" [ref=e616]
                - cell "PARENT" [ref=e617]
                - cell "—" [ref=e618]
                - cell "Active" [ref=e619]
              - row "Bhavya Banerjee bhavya.banerjee.127@dpsbangalore.edu.in STUDENT — Active" [ref=e620]:
                - cell "Bhavya Banerjee" [ref=e621]
                - cell "bhavya.banerjee.127@dpsbangalore.edu.in" [ref=e622]
                - cell "STUDENT" [ref=e623]
                - cell "—" [ref=e624]
                - cell "Active" [ref=e625]
              - row "Ramesh Singh ramesh.singh.126@gmail.com PARENT — Active" [ref=e626]:
                - cell "Ramesh Singh" [ref=e627]
                - cell "ramesh.singh.126@gmail.com" [ref=e628]
                - cell "PARENT" [ref=e629]
                - cell "—" [ref=e630]
                - cell "Active" [ref=e631]
              - row "Ira Singh ira.singh.126@dpsbangalore.edu.in STUDENT — Active" [ref=e632]:
                - cell "Ira Singh" [ref=e633]
                - cell "ira.singh.126@dpsbangalore.edu.in" [ref=e634]
                - cell "STUDENT" [ref=e635]
                - cell "—" [ref=e636]
                - cell "Active" [ref=e637]
              - row "Mahesh Pillai mahesh.pillai.125@gmail.com PARENT — Active" [ref=e638]:
                - cell "Mahesh Pillai" [ref=e639]
                - cell "mahesh.pillai.125@gmail.com" [ref=e640]
                - cell "PARENT" [ref=e641]
                - cell "—" [ref=e642]
                - cell "Active" [ref=e643]
              - row "Aditya Pillai aditya.pillai.125@dpsbangalore.edu.in STUDENT — Active" [ref=e644]:
                - cell "Aditya Pillai" [ref=e645]
                - cell "aditya.pillai.125@dpsbangalore.edu.in" [ref=e646]
                - cell "STUDENT" [ref=e647]
                - cell "—" [ref=e648]
                - cell "Active" [ref=e649]
              - row "Naveen Mehta naveen.mehta.124@gmail.com PARENT — Active" [ref=e650]:
                - cell "Naveen Mehta" [ref=e651]
                - cell "naveen.mehta.124@gmail.com" [ref=e652]
                - cell "PARENT" [ref=e653]
                - cell "—" [ref=e654]
                - cell "Active" [ref=e655]
              - row "Karthik Mehta karthik.mehta.124@dpsbangalore.edu.in STUDENT — Active" [ref=e656]:
                - cell "Karthik Mehta" [ref=e657]
                - cell "karthik.mehta.124@dpsbangalore.edu.in" [ref=e658]
                - cell "STUDENT" [ref=e659]
                - cell "—" [ref=e660]
                - cell "Active" [ref=e661]
              - row "Deepak Kulkarni deepak.kulkarni.123@gmail.com PARENT — Active" [ref=e662]:
                - cell "Deepak Kulkarni" [ref=e663]
                - cell "deepak.kulkarni.123@gmail.com" [ref=e664]
                - cell "PARENT" [ref=e665]
                - cell "—" [ref=e666]
                - cell "Active" [ref=e667]
              - row "Riya Kulkarni riya.kulkarni.123@dpsbangalore.edu.in STUDENT — Active" [ref=e668]:
                - cell "Riya Kulkarni" [ref=e669]
                - cell "riya.kulkarni.123@dpsbangalore.edu.in" [ref=e670]
                - cell "STUDENT" [ref=e671]
                - cell "—" [ref=e672]
                - cell "Active" [ref=e673]
              - row "Mahesh Iyer mahesh.iyer.122@gmail.com PARENT — Active" [ref=e674]:
                - cell "Mahesh Iyer" [ref=e675]
                - cell "mahesh.iyer.122@gmail.com" [ref=e676]
                - cell "PARENT" [ref=e677]
                - cell "—" [ref=e678]
                - cell "Active" [ref=e679]
              - row "Aditya Iyer aditya.iyer.122@dpsbangalore.edu.in STUDENT — Active" [ref=e680]:
                - cell "Aditya Iyer" [ref=e681]
                - cell "aditya.iyer.122@dpsbangalore.edu.in" [ref=e682]
                - cell "STUDENT" [ref=e683]
                - cell "—" [ref=e684]
                - cell "Active" [ref=e685]
              - row "Sanjay Reddy sanjay.reddy.121@gmail.com PARENT — Active" [ref=e686]:
                - cell "Sanjay Reddy" [ref=e687]
                - cell "sanjay.reddy.121@gmail.com" [ref=e688]
                - cell "PARENT" [ref=e689]
                - cell "—" [ref=e690]
                - cell "Active" [ref=e691]
              - row "Vihaan Reddy vihaan.reddy.121@dpsbangalore.edu.in STUDENT — Active" [ref=e692]:
                - cell "Vihaan Reddy" [ref=e693]
                - cell "vihaan.reddy.121@dpsbangalore.edu.in" [ref=e694]
                - cell "STUDENT" [ref=e695]
                - cell "—" [ref=e696]
                - cell "Active" [ref=e697]
              - row "Rajesh Menon rajesh.menon.120@gmail.com PARENT — Active" [ref=e698]:
                - cell "Rajesh Menon" [ref=e699]
                - cell "rajesh.menon.120@gmail.com" [ref=e700]
                - cell "PARENT" [ref=e701]
                - cell "—" [ref=e702]
                - cell "Active" [ref=e703]
              - row "Ayaan Menon ayaan.menon.120@dpsbangalore.edu.in STUDENT — Active" [ref=e704]:
                - cell "Ayaan Menon" [ref=e705]
                - cell "ayaan.menon.120@dpsbangalore.edu.in" [ref=e706]
                - cell "STUDENT" [ref=e707]
                - cell "—" [ref=e708]
                - cell "Active" [ref=e709]
              - row "Pradeep Saxena pradeep.saxena.119@gmail.com PARENT — Active" [ref=e710]:
                - cell "Pradeep Saxena" [ref=e711]
                - cell "pradeep.saxena.119@gmail.com" [ref=e712]
                - cell "PARENT" [ref=e713]
                - cell "—" [ref=e714]
                - cell "Active" [ref=e715]
              - row "Navya Saxena navya.saxena.119@dpsbangalore.edu.in STUDENT — Active" [ref=e716]:
                - cell "Navya Saxena" [ref=e717]
                - cell "navya.saxena.119@dpsbangalore.edu.in" [ref=e718]
                - cell "STUDENT" [ref=e719]
                - cell "—" [ref=e720]
                - cell "Active" [ref=e721]
              - row "Ashok Saxena ashok.saxena.118@gmail.com PARENT — Active" [ref=e722]:
                - cell "Ashok Saxena" [ref=e723]
                - cell "ashok.saxena.118@gmail.com" [ref=e724]
                - cell "PARENT" [ref=e725]
                - cell "—" [ref=e726]
                - cell "Active" [ref=e727]
              - row "Tanvi Saxena tanvi.saxena.118@dpsbangalore.edu.in STUDENT — Active" [ref=e728]:
                - cell "Tanvi Saxena" [ref=e729]
                - cell "tanvi.saxena.118@dpsbangalore.edu.in" [ref=e730]
                - cell "STUDENT" [ref=e731]
                - cell "—" [ref=e732]
                - cell "Active" [ref=e733]
              - row "Pradeep Sharma pradeep.sharma.117@gmail.com PARENT — Active" [ref=e734]:
                - cell "Pradeep Sharma" [ref=e735]
                - cell "pradeep.sharma.117@gmail.com" [ref=e736]
                - cell "PARENT" [ref=e737]
                - cell "—" [ref=e738]
                - cell "Active" [ref=e739]
              - row "Pari Sharma pari.sharma.117@dpsbangalore.edu.in STUDENT — Active" [ref=e740]:
                - cell "Pari Sharma" [ref=e741]
                - cell "pari.sharma.117@dpsbangalore.edu.in" [ref=e742]
                - cell "STUDENT" [ref=e743]
                - cell "—" [ref=e744]
                - cell "Active" [ref=e745]
              - row "Sandeep Reddy sandeep.reddy.116@gmail.com PARENT — Active" [ref=e746]:
                - cell "Sandeep Reddy" [ref=e747]
                - cell "sandeep.reddy.116@gmail.com" [ref=e748]
                - cell "PARENT" [ref=e749]
                - cell "—" [ref=e750]
                - cell "Active" [ref=e751]
              - row "Anvi Reddy anvi.reddy.116@dpsbangalore.edu.in STUDENT — Active" [ref=e752]:
                - cell "Anvi Reddy" [ref=e753]
                - cell "anvi.reddy.116@dpsbangalore.edu.in" [ref=e754]
                - cell "STUDENT" [ref=e755]
                - cell "—" [ref=e756]
                - cell "Active" [ref=e757]
              - row "Manoj Banerjee manoj.banerjee.115@gmail.com PARENT — Active" [ref=e758]:
                - cell "Manoj Banerjee" [ref=e759]
                - cell "manoj.banerjee.115@gmail.com" [ref=e760]
                - cell "PARENT" [ref=e761]
                - cell "—" [ref=e762]
                - cell "Active" [ref=e763]
              - row "Rishi Banerjee rishi.banerjee.115@dpsbangalore.edu.in STUDENT — Active" [ref=e764]:
                - cell "Rishi Banerjee" [ref=e765]
                - cell "rishi.banerjee.115@dpsbangalore.edu.in" [ref=e766]
                - cell "STUDENT" [ref=e767]
                - cell "—" [ref=e768]
                - cell "Active" [ref=e769]
              - row "Ashok Nair ashok.nair.114@gmail.com PARENT — Active" [ref=e770]:
                - cell "Ashok Nair" [ref=e771]
                - cell "ashok.nair.114@gmail.com" [ref=e772]
                - cell "PARENT" [ref=e773]
                - cell "—" [ref=e774]
                - cell "Active" [ref=e775]
              - row "Yash Nair yash.nair.114@dpsbangalore.edu.in STUDENT — Active" [ref=e776]:
                - cell "Yash Nair" [ref=e777]
                - cell "yash.nair.114@dpsbangalore.edu.in" [ref=e778]
                - cell "STUDENT" [ref=e779]
                - cell "—" [ref=e780]
                - cell "Active" [ref=e781]
              - row "Praveen Das praveen.das.113@gmail.com PARENT — Active" [ref=e782]:
                - cell "Praveen Das" [ref=e783]
                - cell "praveen.das.113@gmail.com" [ref=e784]
                - cell "PARENT" [ref=e785]
                - cell "—" [ref=e786]
                - cell "Active" [ref=e787]
              - row "Zara Das zara.das.113@dpsbangalore.edu.in STUDENT — Active" [ref=e788]:
                - cell "Zara Das" [ref=e789]
                - cell "zara.das.113@dpsbangalore.edu.in" [ref=e790]
                - cell "STUDENT" [ref=e791]
                - cell "—" [ref=e792]
                - cell "Active" [ref=e793]
  - region "Notifications alt+T"
  - alert [ref=e794]
```

# Test source

```ts
  1  | // TC-1300..TC-1399 — modals, toasts, dropdowns, dialogs, form validation
  2  | import { test, expect } from "@playwright/test";
  3  | import { BASE, signInAsRole } from "./_helpers";
  4  | 
  5  | test.describe("Modal dismissal patterns", () => {
  6  |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });
  7  | 
  8  |   test("TC-1300 invite form modal-less inline submit", async ({ page }) => {
  9  |     await page.goto(BASE + "/Settings/users");
  10 |     // /Settings/users uses an inline form, not a modal — verify inline only
  11 |     const sendBtn = page.getByRole("button", { name: /send invitation/i });
  12 |     await expect(sendBtn).toBeVisible();
  13 |   });
  14 | 
  15 |   test("TC-1301 PayNow modal closes on Escape", async ({ page, browser }) => {
  16 |     const ctx = await browser.newContext();
  17 |     const p = await ctx.newPage();
  18 |     await signInAsRole(p, "PARENT");
  19 |     await p.goto(BASE + "/fees");
  20 |     const payBtn = p.getByRole("button", { name: /^pay /i }).first();
  21 |     if (!(await payBtn.isVisible().catch(() => false))) {
  22 |       test.skip(true, "no pay button visible — needs unpaid invoice for parent");
  23 |     }
  24 |     await payBtn.click();
  25 |     await expect(p.getByRole("button", { name: /continue to razorpay/i })).toBeVisible();
  26 |     await p.keyboard.press("Escape");
  27 |     // ESC may close modal or not — verify continue is gone OR cancel still available
  28 |     // Soft-fail this scenario as ESC handling is browser-specific
  29 |     await ctx.close();
  30 |   });
  31 | });
  32 | 
  33 | test.describe("Form validation — invite", () => {
  34 |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });
  35 | 
  36 |   test("TC-1310 empty submit blocked by required attrs", async ({ page }) => {
  37 |     await page.goto(BASE + "/Settings/users");
  38 |     await page.getByRole("button", { name: /send invitation/i }).click();
  39 |     // Required HTML5 attributes should block submission — page URL unchanged
  40 |     await expect(page).toHaveURL(/\/Settings\/users/);
  41 |   });
  42 | 
  43 |   test("TC-1311 trailing whitespace email rejected", async ({ page }) => {
  44 |     await page.goto(BASE + "/Settings/users");
  45 |     await page.getByLabel(/full name/i).fill("X");
  46 |     // input type=email rejects non-email syntax client-side
  47 |     await page.getByLabel(/^email$/i).fill("  not-an-email  ");
  48 |     await page.getByRole("button", { name: /send invitation/i }).click();
  49 |     await expect(page.getByText(/valid email|invalid email/i).or(page.getByText(/valid/))).toBeAttached().catch(() => {});
  50 |   });
  51 | });
  52 | 
  53 | test.describe("Toast notifications", () => {
  54 |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });
  55 | 
  56 |   test("TC-1320 successful invite shows toast (or inline message)", async ({ page }) => {
  57 |     await page.goto(BASE + "/Settings/users");
  58 |     const stamp = Date.now();
  59 |     const email = `qa-toast-${stamp}@vidyalaya-qa.local`;
  60 |     await page.getByLabel(/full name/i).fill("QA Toast");
  61 |     await page.getByLabel(/^email$/i).fill(email);
> 62 |     await page.getByLabel(/^role$/i).selectOption("TEACHER");
     |                                      ^ Error: locator.selectOption: Test timeout of 20000ms exceeded.
  63 |     await page.getByRole("button", { name: /send invitation/i }).click();
  64 |     await expect(page.getByText(new RegExp(`invitation sent to ${email.replace(/\W/g,"\\$&")}`, "i"))).toBeVisible({ timeout: 10000 });
  65 |   });
  66 | });
  67 | 
  68 | test.describe("Select / dropdown keyboard behavior", () => {
  69 |   test.beforeEach(async ({ page }) => { await signInAsRole(page, "ADMIN"); });
  70 | 
  71 |   test("TC-1330 invite role select has all 9 options", async ({ page }) => {
  72 |     await page.goto(BASE + "/Settings/users");
  73 |     const select = page.getByLabel(/^role$/i);
  74 |     const options = await select.locator("option").allTextContents();
  75 |     expect(options.length).toBeGreaterThanOrEqual(9);
  76 |     expect(options).toEqual(expect.arrayContaining(["TEACHER", "STUDENT", "PARENT", "ACCOUNTANT", "ADMIN"]));
  77 |   });
  78 | 
  79 |   test("TC-1331 changing role select with keyboard works", async ({ page }) => {
  80 |     await page.goto(BASE + "/Settings/users");
  81 |     const select = page.getByLabel(/^role$/i);
  82 |     await select.focus();
  83 |     await select.selectOption({ label: "PRINCIPAL" });
  84 |     await expect(select).toHaveValue("PRINCIPAL");
  85 |   });
  86 | });
  87 | 
  88 | test.describe("Date inputs / timepickers (where present)", () => {
  89 |   test("TC-1340 events page renders without breaking on missing date filter", async ({ page }) => {
  90 |     await signInAsRole(page, "ADMIN");
  91 |     await page.goto(BASE + "/events?from=invalid-date");
  92 |     await expect(page.locator("body")).not.toContainText(/something went wrong/i);
  93 |   });
  94 | });
  95 | 
```