The server is exteced to provide a certain file structure under the
"api_endpoint" subpath which beforehand somehow got contracted with the frontend.

It is supposed to look like "/<stuff/more/stuff>/". Then for each api endpoint it should have a route under f"\${api_path}the_key" under which it provides access to this APIs functions.



