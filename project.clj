(defproject helloapp "0.1.0-SNAPSHOT"
  :description "A HelloWorld app written in ClojureScript for BlackBerry"
  :url ""
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dev-dependencies [[org.clojure/clojure "1.3.0"]
                     [lein-ring "0.5.4"]]
  :plugins [[lein-cljsbuild "0.1.5"]
            [lein-exec "0.1"]]
  :cljsbuild {
    :builds [{:source-path "src"
              :compiler {:output-to "content/scripts/app.js"
                         :optimizations :whitespace
                         :pretty-print true}}]})
