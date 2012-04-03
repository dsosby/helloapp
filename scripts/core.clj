(ns core)

(defn -main
  "Run helper scripts for a WebWorks project"
  [& args]
  (println "Hello, World!"))

(apply -main *command-line-args*)
